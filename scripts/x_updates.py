"""Publish new public RICKS items through Buffer; never log credentials."""
import base64
import json
import os
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = 'https://ricks.kr'
STATE_BRANCH = 'ricks-x-state'
STATE_FILE = 'x-state.json'

def request(url, payload=None, headers=None, method=None):
    req = urllib.request.Request(url, data=None if payload is None else json.dumps(payload).encode(),
                                 headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Do not echo response bodies or headers containing credentials.
        raise RuntimeError(f'HTTP {error.code}; retry later, no automatic mutation retry') from None

def buffer(query, variables=None):
    result = request('https://api.buffer.com', {'query': query, 'variables': variables or {}},
                     {'Authorization': 'Bearer ' + os.environ['BUFFER_API_KEY'],
                      'Content-Type': 'application/json'})
    if result.get('errors'):
        raise RuntimeError('Buffer GraphQL request failed; check account, schema or limits')
    return result['data']

def public_content(action, **data):
    # Use the same public CMS endpoint as the website, not a CDN snapshot.
    cms = pathlib.Path(__file__).resolve().parents[1] / 'site' / 'cms.js'
    match = re.search(r"const endpoint='([^']+)'", cms.read_text())
    if not match or not match[1].startswith('https://script.google.com/macros/s/'):
        raise RuntimeError('Public CMS endpoint missing or invalid')
    result = request(match[1], {'action': action, **data},
                     {'Content-Type': 'text/plain;charset=utf-8'})
    if not result.get('ok'):
        raise RuntimeError('Live public content unavailable; publication deferred')
    return result

def eligible(item):
    summary = item.get('summary', '')
    return (item.get('status') == 'published' and
            item.get('type') in {'Book review', 'Article review', 'Commentary', 'Notice',
                                 'Events', 'Academic publications', 'Research projects'} and
            not summary.startswith(('[RICKS_PROFILE:', '[RICKS_CAROUSEL]', '[RICKS_DELETED]')))

def english(item):
    item = dict(item)
    if item.get('body', '').startswith('[RICKS_BILINGUAL]\n'):
        item.update(json.loads(item['body'][18:]).get('en', {}))
    item['summary'] = re.sub(r'^\[RICKS_ACTIVITY:[^\]]+\]\s*', '', item.get('summary', ''))
    return item

def caption(item):
    item = english(item)
    url = item.get('sourceUrl') or ROOT + '/article/?id=' + urllib.parse.quote(item['id'], safe='')
    title = re.sub(r'\s+', ' ', item['title']).strip()
    summary = re.sub(r'\s+', ' ', item.get('summary', '')).strip()
    # Conservative X weighted length: reserve 23 for t.co and 2 per Unicode char.
    def weight(s):
        return sum(1 if ord(c) <= 0x10ff or 0x2000 <= ord(c) <= 0x206f else 2 for c in s)
    def shorten(s, budget):
        if weight(s) <= budget:
            return s
        out = ''
        for c in s:
            if weight(out + c) + 2 > budget:
                break
            out += c
        return out.rstrip() + '…'
    title = shorten(title, 170)
    budget = 280 - weight(title) - 23 - 4
    summary = shorten(summary, budget) if budget >= 35 and summary != title else ''
    return title + ('\n' + summary if summary else '') + '\n' + url

def state_read():
    repo = os.environ['GITHUB_REPOSITORY']
    url = f'https://api.github.com/repos/{repo}/contents/{STATE_FILE}'
    headers = {'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
               'Accept': 'application/vnd.github+json'}
    result = request(url + '?ref=' + STATE_BRANCH, headers=headers)
    return json.loads(base64.b64decode(result['content'])), result['sha'], url, headers

def state_save(state, sha, url, headers):
    encoded = base64.b64encode(json.dumps(state, ensure_ascii=False, indent=2).encode()).decode()
    result = request(url, {'message': 'Record RICKS X publication state', 'content': encoded,
                          'branch': STATE_BRANCH, 'sha': sha}, headers, 'PUT')
    return result['content']['sha']

def main():
    if not os.environ.get('BUFFER_API_KEY'):
        print('Inactive: add BUFFER_API_KEY in GitHub Actions secrets.')
        return
    account = buffer('{ account { email organizations { id name } } }')['account']
    if account['email'].lower() != 'ricks@hanyang.ac.kr':
        raise RuntimeError('Refusing to use a different Buffer account')
    channels = []
    for org in account['organizations']:
        channels += buffer('query($input: ChannelsInput!) { channels(input:$input) { id name service serviceId organizationId isDisconnected isLocked isQueuePaused } }',
                           {'input': {'organizationId': org['id']}})['channels']
    choices = [c for c in channels if c['service'] == 'twitter']
    handle = (os.environ.get('BUFFER_X_HANDLE') or 'RICKS_HYUGSIS').lstrip('@').lower()
    if not handle:
        print('Verification only: set repository variable BUFFER_X_HANDLE to the intended handle.')
        print('Connected X channels:', [(c['name'], c['id']) for c in choices])
        return
    choices = [c for c in choices if c['name'].lstrip('@').lower() == handle]
    if len(choices) != 1:
        raise RuntimeError('Expected exactly one matching X channel')
    channel = choices[0]
    if any(channel[k] for k in ('isDisconnected', 'isLocked', 'isQueuePaused')):
        raise RuntimeError('X channel disconnected, locked or paused')
    if os.environ.get('X_UPDATES_ENABLED') != 'true':
        print('Account and X channel verified. Inactive until X_UPDATES_ENABLED=true.')
        return
    state, sha, url, headers = state_read()
    identity = {'channelId': channel['id'], 'serviceId': channel['serviceId']}
    if state.get('identity') not in (None, identity):
        raise RuntimeError('X account identity changed; refusing publication')
    if state.get('identity') is None:
        state['identity'] = identity
        sha = state_save(state, sha, url, headers)
    feed = public_content('publicFeed')
    records = state['records']
    pending = [key for key, record in records.items() if record['status'] == 'pending']
    if pending:
        raise RuntimeError('Uncertain previous request: inspect Buffer and reconcile x-state.json before retrying')
    queue_url = f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/contents/x-routine-queue.json?ref=main"
    queue_blob = request(queue_url, headers=headers)
    queue = json.loads(base64.b64decode(queue_blob['content']))
    routine_items = []
    for entry in queue['items']:
        if (not isinstance(entry.get('id'), str) or
                not entry['id'].startswith(('weekly:', 'classics:')) or
                not isinstance(entry.get('title'), str) or
                not isinstance(entry.get('summary'), str) or
                not isinstance(entry.get('sourceUrl'), str) or
                not entry['sourceUrl'].startswith('https://')):
            raise RuntimeError('Invalid routine queue entry')
        routine_items.append(dict(entry, routineQueue=True))
    count = 0
    for item in sorted(feed['items'] + routine_items, key=lambda x: (x.get('date', ''), x['id'])):
        ident = item['id']
        if (not item.get('routineQueue') and not eligible(item)) or ident in records:
            continue
        if item.get('routineQueue'):
            text = caption(item)
        else:
            detail = public_content('publicArticle', id=ident)
            if not detail.get('ok') or detail['item']['id'] != ident or not eligible(detail['item']):
                raise RuntimeError('Public detail is unavailable or no longer published')
            text = caption(detail['item'])
        records[ident] = {'status': 'pending', 'text': text, 'sourceUrl': item.get('sourceUrl') or ROOT + '/article/?id=' + ident}
        # Persist BEFORE the mutation. A timeout cannot cause duplicate posts on retry.
        sha = state_save(state, sha, url, headers)
        result = buffer('mutation($input: CreatePostInput!) { createPost(input:$input) { ... on PostActionSuccess { post { id text dueAt status } } ... on MutationError { message } } }',
                        {'input': {'channelId': channel['id'], 'text': text, 'assets': [],
                                   'schedulingType': 'automatic', 'mode': 'addToQueue',
                                   'needsApproval': False, 'saveToDraft': False,
                                   'source': 'ricks-website-updates'}})['createPost']
        if not result.get('post'):
            # A definite rejection created no post. Permit a subsequent daily retry.
            del records[ident]
            state_save(state, sha, url, headers)
            raise RuntimeError('Buffer rejected post; check queue capacity and account limits')
        post = result['post']
        records[ident].update(status='scheduled', bufferPostId=post['id'], dueAt=post['dueAt'])
        sha = state_save(state, sha, url, headers)
        verified = buffer('query($input: PostInput!) { post(input:$input) { id text channelId status } }',
                          {'input': {'id': post['id']}})['post']
        if verified['text'] != text or verified['channelId'] != channel['id']:
            raise RuntimeError('Scheduled post readback mismatch; investigate without rescheduling')
        print('Verified scheduled X update for', ident, 'Buffer ID', post['id'])
        count += 1
        if count >= 5:
            break
    print('New updates scheduled:', count)

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('X update stopped:', str(error), file=sys.stderr)
        sys.exit(1)
