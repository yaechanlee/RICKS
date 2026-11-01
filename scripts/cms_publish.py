"""Publish RICKS content through the authenticated CMS; never log credentials."""
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def endpoint():
    source = (ROOT / "site" / "cms.js").read_text(encoding="utf-8")
    match = re.search(r"const endpoint='([^']+)'", source)
    if not match or not match.group(1).startswith("https://script.google.com/macros/s/"):
        raise RuntimeError("CMS endpoint configuration is invalid.")
    return match.group(1)

def request(action, **data):
    body = json.dumps({"action": action, **data}).encode()
    req = urllib.request.Request(endpoint(), data=body,
        headers={"Content-Type": "text/plain;charset=utf-8"})
    with urllib.request.urlopen(req, timeout=120) as response:
        result = json.load(response)
    if not result.get("ok"):
        message = "CMS rejected " + action
        if action == "adminSave":
            error = str(result.get("error", "")).lower()
            fields = [field for field in ("image", "photo", "body", "title", "date", "summary", "author", "affiliation", "id", "status") if field in error]
            message += "; validation fields: " + (", ".join(fields) or "unspecified")
        raise RuntimeError(message + ".")
    return result

def main():
    password = os.environ.get("RICKS_CMS_PASSWORD")
    if not password:
        raise RuntimeError("Add the RICKS_CMS_PASSWORD repository secret before running.")
    raw = os.environ.get("RICKS_POST_JSON", "").strip()
    item = json.loads(raw) if raw else None
    request_file = os.environ.get("RICKS_REQUEST_FILE", "").strip()
    if request_file:
        if raw or request_file != "cms-publication-request.json":
            raise RuntimeError("Use exactly one supported publication input.")
        envelope = json.loads((ROOT / request_file).read_text(encoding="utf-8"))
        if (not isinstance(envelope, dict) or
                set(envelope) != {"requestId", "item"} or
                not isinstance(envelope["requestId"], str) or
                not re.fullmatch(r"[A-Za-z0-9._-]{1,120}", envelope["requestId"])):
            raise RuntimeError("Publication request requires requestId and item.")
        item = envelope["item"]
    if item is not None:
        if not isinstance(item, dict) or not item.get("title") or not item.get("body"):
            raise RuntimeError("Post JSON requires title and body.")
        if item.get("type") not in ("Book review", "Article review", "Commentary", "Notice"):
            raise RuntimeError("Use the CMS storage content types.")
        if item.get("status") not in ("draft", "published"):
            raise RuntimeError("Post status must be draft or published.")
    token = request("adminLogin", password=password)["token"]
    try:
        if item is None:
            request("adminList", token=token)
            print("Verified: automatic authenticated CMS access works.")
            return
        if not item.get("id"):
            existing = request("adminList", token=token).get("items", [])
            duplicate = next((entry for entry in existing
                              if entry.get("title") == item["title"]), None)
            if duplicate:
                print("Existing post found; no duplicate created: " + duplicate["id"])
                return
        elif not item.get("updatedAt"):
            raise RuntimeError("Editing an existing post requires its current updatedAt.")
        saved = request("adminSave", token=token, item=item)["item"]
        verified = request("adminGet", token=token, id=saved["id"])["item"]
        if verified["updatedAt"] != saved["updatedAt"]:
            raise RuntimeError("Post verification failed.")
        print("Verified saved post: " + saved["id"])
        if saved["status"] == "published":
            print("Public notice: https://ricks.kr/article/?id=" + saved["id"])
    finally:
        try:
            request("adminLogout", token=token)
        except Exception:
            print("Session cleanup could not be confirmed; temporary session will expire.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Do not serialize HTTP request/response objects or environment values.
        print("Publishing failed: " + (str(exc) if isinstance(exc, (RuntimeError, json.JSONDecodeError)) else type(exc).__name__))
        sys.exit(1)
