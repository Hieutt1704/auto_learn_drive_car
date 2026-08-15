#!/usr/bin/env python3
"""Đọc JSON của read.sh (sau khi đã trả lời, feedback đang hiện) từ stdin.
Nếu feedback cho biết đáp án đúng, lưu vào cache.json. In 'SAVED <index>' hoặc 'SKIP <lý do>'.
"""
import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cache_common import norm, question_key, load_cache, save_cache

d = json.load(sys.stdin)
options = d.get("options") or []
feedback = d.get("feedback") or {}

if not options:
    print("SKIP no-options")
    sys.exit(0)

if not feedback.get("shown"):
    print("SKIP no-feedback")
    sys.exit(0)

idx = feedback.get("correctIndex", -1)
if idx is None or idx < 0 or idx >= len(options):
    print("SKIP correctIndex-not-found")
    sys.exit(0)

key = question_key(options)
correct_text = options[idx]["text"]
cache = load_cache()
cache[key] = {
    "question": (d.get("question") or "")[:200],
    "correctNorm": norm(correct_text),
    "correctText": correct_text,
    "options": [norm(o["text"]) for o in options],
}
save_cache(cache)
print(f"SAVED {idx}")
