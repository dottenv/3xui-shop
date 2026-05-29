import json
import os
from flask import Flask, render_template

app = Flask(__name__)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def load_json(name):
    path = os.path.join(DATA_DIR, name)
    with open(path, encoding="utf-8") as f:
        return json.load(f)

config = load_json("config.json")
plans = load_json("plans.json")

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
