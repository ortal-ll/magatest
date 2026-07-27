#!/usr/bin/env python3
"""Fill missing Kazakh fields (textKz / optionsKz / explanationKz) for quiz banks."""
from __future__ import annotations

import hashlib
import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1] / "data"
CACHE = Path("/tmp/kz_translate_cache.json")
translator = GoogleTranslator(source="ru", target="kk")

cache: dict[str, str] = {}
if CACHE.exists():
    cache = json.loads(CACHE.read_text(encoding="utf-8"))

CYR = re.compile(r"[А-Яа-яЁёІіҒғҚқҢңӨөҰұҮүҺһ]")


def has_cyrillic(s: str) -> bool:
    return bool(CYR.search(s))


def _tr_chunk(chunk: str) -> str:
    chunk = chunk.strip("\n")
    if not chunk:
        return chunk
    if not has_cyrillic(chunk):
        return chunk
    for attempt in range(6):
        try:
            r = translator.translate(chunk)
            time.sleep(0.15)
            return r if r is not None else chunk
        except Exception as e:  # noqa: BLE001
            wait = 1.8 * (attempt + 1)
            print(f"  retry {attempt + 1}: {e} sleep {wait:.1f}s", flush=True)
            time.sleep(wait)
    print(f"  FAIL keep RU: {chunk[:70]}", flush=True)
    return chunk


def translate(text: str) -> str:
    text = text.strip()
    if not text:
        return text
    if not has_cyrillic(text):
        return text
    key = hashlib.sha1(text.encode("utf-8")).hexdigest()
    if key in cache:
        return cache[key]

    parts = text.split("\n")
    out_parts: list[str] = []
    buf = ""
    for p in parts:
        if len(buf) + len(p) + 1 > 4200:
            out_parts.append(_tr_chunk(buf))
            buf = p
        else:
            buf = f"{buf}\n{p}" if buf else p
    if buf:
        out_parts.append(_tr_chunk(buf))
    result = "\n".join(out_parts)
    cache[key] = result
    return result


def save_cache() -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")


def fill_bank(name: str) -> None:
    path = ROOT / f"{name}.json"
    bank = json.loads(path.read_text(encoding="utf-8"))
    total = len(bank["questions"])
    filled = 0

    for i, q in enumerate(bank["questions"]):
        changed = False
        if not q.get("textKz"):
            q["textKz"] = translate(q["text"])
            changed = True
        if not q.get("optionsKz") or len(q.get("optionsKz") or []) != len(q["options"]):
            q["optionsKz"] = [translate(o) for o in q["options"]]
            changed = True
        if q.get("explanation") and not q.get("explanationKz"):
            q["explanationKz"] = translate(q["explanation"])
            changed = True

        if changed:
            filled += 1
            # persist after every question so crashes don't lose work
            path.write_text(
                json.dumps(bank, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            save_cache()
            print(f"[{name}] {i + 1}/{total} filled (+{filled})", flush=True)

    # final write
    path.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    save_cache()

    bad = 0
    for i, q in enumerate(bank["questions"]):
        if not q.get("textKz") or not q.get("optionsKz") or len(q["optionsKz"]) != len(
            q["options"]
        ):
            bad += 1
            print(f"[{name}] BAD q{i}", flush=True)
    print(f"[{name}] done filled={filled} bad={bad} total={total}", flush=True)


def main() -> int:
    targets = sys.argv[1:] or ["algorithms", "databases"]
    for name in targets:
        print(f"=== {name} ===", flush=True)
        fill_bank(name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
