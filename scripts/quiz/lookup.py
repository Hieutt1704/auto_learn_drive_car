#!/usr/bin/env python3
"""Đọc JSON của read.sh từ stdin, tra cache. In 'HIT <index>' hoặc 'MISS'."""
import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cache_common import norm, question_key, load_cache

d = json.load(sys.stdin)
options = d.get("options") or []
if not options:
    print("MISS")
    sys.exit(0)

key = question_key(options)
cache = load_cache()
entry = cache.get(key)
if not entry:
    print("MISS")
    sys.exit(0)

correct_norm = entry.get("correctNorm")
for o in options:
    if norm(o["text"]) == correct_norm:
        print(f"HIT {o['index']}")
        sys.exit(0)

print("MISS")
