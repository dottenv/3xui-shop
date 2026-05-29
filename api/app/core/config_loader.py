import json
import os
from copy import deepcopy

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
PLANS_PATH = os.path.join(BASE_DIR, "plans.json")

_config_cache = {}
_plans_cache = {}


def _deep_merge(base, overlay):
    result = deepcopy(base)
    for key, value in overlay.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        elif key in result and isinstance(result[key], list) and isinstance(value, list):
            merged = []
            for i, item in enumerate(value):
                if i < len(result[key]) and isinstance(result[key][i], dict) and isinstance(item, dict):
                    merged.append(_deep_merge(result[key][i], item))
                else:
                    merged.append(item)
            result[key] = merged
        else:
            result[key] = value
    return result


def _strip_internal(data):
    if isinstance(data, dict):
        return {k: _strip_internal(v) for k, v in data.items() if not k.startswith("_")}
    if isinstance(data, list):
        return [_strip_internal(item) for item in data]
    return data


def load_config(lang: str = "ru"):
    cache_key = f"config_{lang}"
    if cache_key in _config_cache:
        return _config_cache[cache_key]

    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            raw = json.load(f)
    except FileNotFoundError:
        return {}

    result = raw
    if lang != "ru":
        trans_key = f"_{lang}"
        translations = raw.get(trans_key)
        if translations:
            result = _deep_merge(raw, translations)

    result = _strip_internal(result)
    _config_cache[cache_key] = result
    return result


def load_plans(lang: str = "ru"):
    cache_key = f"plans_{lang}"
    if cache_key in _plans_cache:
        return _plans_cache[cache_key]

    try:
        with open(PLANS_PATH, encoding="utf-8") as f:
            raw = json.load(f)
    except FileNotFoundError:
        return {"plans": [], "payment_methods": []}

    result = raw
    if lang != "ru":
        trans_key = f"_{lang}"
        translations = raw.get(trans_key)
        if translations:
            result = _deep_merge(raw, translations)

    result = _strip_internal(result)
    _plans_cache[cache_key] = result
    return result


def get_available_langs():
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        return raw.get("_langs", ["ru"])
    except FileNotFoundError:
        return ["ru"]


def clear_cache():
    _config_cache.clear()
    _plans_cache.clear()
