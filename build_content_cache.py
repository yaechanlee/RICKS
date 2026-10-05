"""Build a public-only, text-first mirror. No editor credentials are used."""
import base64, concurrent.futures, datetime, hashlib, io, json, pathlib, re, urllib.request
from PIL import Image, ImageOps
SITE=pathlib.Path(__file__).resolve().parent/'site'
ENDPOINT=re.search(r"const endpoint='([^']+)'",(SITE/'cms.js').read_text()).group(1)
OUT=SITE/'content-cache'
OUT.mkdir(exist_ok=True)
STAMP=datetime.datetime.now(datetime.timezone.utc).isoformat()
def api(action, **data):
    request=urllib.request.Request(ENDPOINT,data=json.dumps(dict(action=action,**data)).encode(),headers={'Content-Type':'text/plain;charset=utf-8'})
    with urllib.request.urlopen(request, timeout=90) as response: result=json.load(response)
    if not result.get('ok'): raise RuntimeError('Public content request failed')
    return result

def save(name, value):
    (OUT/name).write_text(json.dumps(value, ensure_ascii=False,separators=(',',':')))

def snapshot(summary):
    ident=summary['id']
    if not re.fullmatch(r'[A-Za-z0-9_-]+', ident): raise ValueError('Invalid public ID')
    item=dict(summary,body='{}',images=[]) if '[PROFILE_DRAFT]' in summary.get('summary','') or '[PROFILE_REMOVED]' in summary.get('summary','') else api('publicArticle',id=ident)['item']
    if item.get('status')!='published': raise ValueError('Refusing to mirror unpublished content')
    for index,photo in enumerate(item.get('images',[])):
        data=photo.get('data','')
        if not data.startswith('data:image/'): continue
        raw=base64.b64decode(data.split(',',1)[1],validate=True)
        with Image.open(io.BytesIO(raw)) as original:
            image=ImageOps.exif_transpose(original).convert('RGB')
            image.thumbnail((1600,1600))
            buffer=io.BytesIO();image.save(buffer,'WEBP',quality=82,method=6)
            encoded=buffer.getvalue();name=hashlib.sha256(encoded).hexdigest()[:24]+'.webp'
            (OUT/name).write_bytes(encoded)
            photo['data']='/content-cache/'+name
            cover=image.copy();cover.thumbnail((640,640));buffer=io.BytesIO();cover.save(buffer,'WEBP',quality=78,method=6)
            encoded=buffer.getvalue();name=hashlib.sha256(encoded).hexdigest()[:24]+'-cover.webp'
            (OUT/name).write_bytes(encoded)
            photo['thumbnail']='/content-cache/'+name
    save(ident+'.json',dict(ok=True,generatedAt=STAMP,item=item))
    return ident

def main():
    feed=api('publicFeed')
    items=[x for x in feed['items'] if x.get('status')=='published' and x.get('summary')!='[RICKS_DELETED]']
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: list(pool.map(snapshot,items))
    save('feed.json',dict(ok=True,generatedAt=STAMP,items=items))
    # Bust old script URLs and establish connections without blocking rendering.
    cms_version=hashlib.sha256((SITE/'cms.js').read_bytes()).hexdigest()[:12]
    for path in SITE.rglob('*.html'):
        text=path.read_text()
        text=re.sub(r'/cms\.js\?v=[^"\s]+','/cms.js?v='+cms_version,text)
        if '/cms.js' in text and 'href="https://script.google.com"' not in text:
            text=text.replace('</head>','<link rel="preconnect" href="https://script.google.com"><link rel="preconnect" href="https://script.googleusercontent.com"></head>')
        path.write_text(text)
    print('Mirrored',len(items),'published items; article text and images are separate.')
if __name__=='__main__': main()
