import re
import hashlib
import json
import os

CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache.json")


def norm(text):
    text = re.sub(r"^\s*\d+[-.]\s*", "", text or "")
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def question_key(options):
    parts = sorted(norm(o["text"]) for o in options)
    joined = "|".join(parts)
    return hashlib.md5(joined.encode("utf-8")).hexdigest()


def load_cache():
    if not os.path.exists(CACHE_PATH):
        return {}
    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def save_cache(cache):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2, sort_keys=True)
