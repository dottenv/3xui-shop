import json
import os
import time
import urllib.request
import urllib.error
from flask import Flask, render_template

app = Flask(__name__)

API_INTERNAL = os.getenv("API_INTERNAL_URL", "http://api:8000")

_cache = {"value": False, "expires": 0}
_plans_cache = {"value": {}, "expires": 0}
_config_cache = {"value": {}, "expires": 0}
CACHE_TTL = 30


def _fetch(path):
    try:
        req = urllib.request.Request(f"{API_INTERNAL}{path}")
        with urllib.request.urlopen(req, timeout=2) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


def check_maintenance():
    global _cache
    now = time.time()
    if now < _cache["expires"]:
        return _cache["value"]
    data = _fetch("/public/maintenance")
    _cache = {"value": data.get("site", False) if data else False, "expires": now + CACHE_TTL}
    return _cache["value"]


def get_config():
    global _config_cache
    now = time.time()
    if now < _config_cache["expires"]:
        return _config_cache["value"]
    data = _fetch("/public/config?lang=ru")
    _config_cache = {"value": data or {}, "expires": now + CACHE_TTL}
    return _config_cache["value"]


def get_plans():
    global _plans_cache
    now = time.time()
    if now < _plans_cache["expires"]:
        return _plans_cache["value"]
    data = _fetch("/public/plans?lang=ru")
    _plans_cache = {"value": data or {}, "expires": now + CACHE_TTL}
    return _plans_cache["value"]


@app.before_request
def maintenance_check():
    if check_maintenance():
        return render_template("maintenance.html"), 503


@app.context_processor
def inject_globals():
    return dict(config=get_config(), plans=get_plans())


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/features")
def features():
    return render_template("features.html")


@app.route("/pricing")
def pricing():
    return render_template("pricing.html")


@app.route("/faq")
def faq():
    return render_template("faq.html")


if __name__ == "__main__":
    app.run(debug=True)
