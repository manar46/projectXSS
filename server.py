from flask import Flask, request, jsonify, render_template
import json, os, re
from datetime import datetime

app = Flask(__name__, static_folder='stat')

COMMENTS_FILE = "comments.json"
ATTACKS_FILE = "attacks.json"

if not os.path.exists(COMMENTS_FILE):
    with open(COMMENTS_FILE, "w") as f:
        json.dump([], f)

if not os.path.exists(ATTACKS_FILE):
    with open(ATTACKS_FILE, "w") as f:
        json.dump([], f)

def detect_xss(text):
    patterns = [
        r"<script.*?>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<.*?>"
    ]

    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True

    return False


@app.route("/")
def index():
    return render_template("memstore.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/submit", methods=["POST"])
def submit_comment():
    data = request.get_json()
    comment = data.get("comment", "").strip()

    if comment:

        # 🔐 فحص
        if detect_xss(comment):
            print("🚨 XSS in comment:", comment)

            with open(ATTACKS_FILE, "r") as f:
                attacks = json.load(f)

            attacks.append({
                "input": comment,
                "type": "comment",
                "time": str(datetime.now())
            })

            with open(ATTACKS_FILE, "w") as f:
                json.dump(attacks, f)

            return jsonify({"status": "blocked"})

        # ✅ تخزين عادي
        with open(COMMENTS_FILE, "r") as f:
            comments = json.load(f)

        comments.append({"comment": comment})

        with open(COMMENTS_FILE, "w") as f:
            json.dump(comments, f)

    return jsonify({"status": "ok"})


@app.route("/customization", methods=["POST"])
def customization():
    data = request.get_json()
    text = data.get("customization", "").strip()

    if text:

        if detect_xss(text):
            print("🚨 XSS in customization:", text)

            with open(ATTACKS_FILE, "r") as f:
                attacks = json.load(f)

            attacks.append({
                "input": text,
                "type": "customization",
                "time": str(datetime.now())
            })

            with open(ATTACKS_FILE, "w") as f:
                json.dump(attacks, f)

            return jsonify({"status": "blocked"})

        print("✅ Safe:", text)

    return jsonify({"status": "ok"})


@app.route("/comments", methods=["GET"])
def get_comments():
    with open(COMMENTS_FILE, "r") as f:
        comments = json.load(f)
    return jsonify(comments)


@app.route("/attacks", methods=["GET"])
def get_attacks():
    with open("attacks.json", "r") as f:
        attacks = json.load(f)
    return jsonify(attacks)

@app.route("/attack", methods=["POST"])
def log_attack():
    data = request.get_json()
    text = data.get("input", "")
    attack_type = classify_attack(text)
    ip = request.remote_addr

    with open("attacks.json", "r") as f:
        attacks = json.load(f)

    attacks.append({
        "input": text,
        "type": attack_type,
        "time": str(datetime.now()),
        "ip": ip
    })

    with open("attacks.json", "w") as f:
        json.dump(attacks, f)

    return jsonify({"status": "logged"})

def classify_attack(text):
    text = text.lower()

    if "<script" in text:
        return "script"

    elif "onerror=" in text or "onload=" in text:
        return "event"

    elif "javascript:" in text:
        return "javascript"

    elif "<" in text and ">" in text:
        return "html"

    return "unknown"

@app.route("/")
def home():
return "Hello World"

if __name__ == "__main__":
    app.run(debug=True)