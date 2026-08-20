import re
import hashlib
import json
import os

CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache.json")


def norm(text):
    text = re.sub(r"^\s*\d+[-.]\s*", "", text or "")
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def question_key(question, options, image_src=None):
    # QUAN TRỌNG: phải tính cả nội dung câu hỏi, không chỉ tập đáp án — bộ đề này có nhiều
    # câu hỏi khác nhau (vd. các mốc tốc độ tối đa 80/70/60/50 km/h) dùng chung một bộ đáp án
    # giống hệt nhau, chỉ khác câu hỏi. Nếu key chỉ dựa vào đáp án, các câu này sẽ bị coi là
    # cùng 1 câu và đè cache lẫn nhau (đáp án đúng của câu học sau sẽ ghi đè lên câu học trước).
    #
    # Với câu có ảnh (biển báo), đáp án chỉ ghi chung chung "Biển 1/2/3" — không mô tả nội dung
    # — và một số câu bị trích sai/giống nhau phần text câu hỏi (lỗi detect câu hỏi), nên bắt
    # buộc phải đưa thêm URL ảnh vào key mới phân biệt được chính xác từng câu.
    parts = sorted(norm(o["text"]) for o in options)
    joined = norm(question) + "||" + "|".join(parts) + "||" + (image_src or "")
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
