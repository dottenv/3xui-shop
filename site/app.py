import json
import os
import time
import urllib.request
import urllib.error
from flask import Flask, render_template

app = Flask(__name__)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
API_INTERNAL = os.getenv("API_INTERNAL_URL", "http://api:8000")

_cache = {"value": False, "expires": 0}
CACHE_TTL = 30


def load_json(name):
    path = os.path.join(DATA_DIR, name)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


config = load_json("config.json")
plans = load_json("plans.json")


def check_maintenance():
    global _cache
    now = time.time()
    if now < _cache["expires"]:
        return _cache["value"]
    try:
        req = urllib.request.Request(f"{API_INTERNAL}/public/maintenance")
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read())
            _cache = {"value": data.get("site", False), "expires": now + CACHE_TTL}
    except Exception:
        _cache = {"value": False, "expires": now + CACHE_TTL}
    return _cache["value"]


@app.before_request
def maintenance_check():
    if check_maintenance():
        return render_template("maintenance.html"), 503


@app.context_processor
def inject_globals():
    return dict(config=config, plans=plans)


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
