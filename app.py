from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
import re

app = Flask(__name__)

# ===================== EXCEL FILES =====================
EXCEL_FILES = [
    "chatbot_gehu.xlsx",
    "gehu_smart_chatbot.xlsx",
    "chatbot_gehu_improved.xlsx",
    "GEHU.xlsx"
]

dfs = []

for file in EXCEL_FILES:
    if os.path.exists(file):
        dfs.append(pd.read_excel(file))
    else:
        print(f"Warning: {file} not found, skipped")

if not dfs:
    raise FileNotFoundError("No Excel file found!")

# Merge all Excel data
df = pd.concat(dfs, ignore_index=True)

# Ensure required columns
required_cols = {"question", "answer"}
if not required_cols.issubset(df.columns):
    raise ValueError("Excel must contain 'question' and 'answer' columns")

# If key column missing, generate it
def normalize(text):
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9 ]", "", text)
    stopwords = {
        "what","is","the","of","in","for","does","do","are",
        "a","an","to","and","about","please","tell","me"
    }
    words = [w for w in text.split() if w not in stopwords]
    return " ".join(words)

if "key" not in df.columns:
    df["key"] = df["question"].apply(normalize)

# ===================== ANSWER LOGIC =====================
def get_answer(user_input):
    text = user_input.lower().strip()

    # ---------- 1. EXACT QUESTION MATCH ----------
    for _, row in df.iterrows():
        if text == str(row["question"]).lower().strip():
            return row["answer"]

    # ---------- 2. QUESTION CONTAINS MATCH ----------
    for _, row in df.iterrows():
        q = str(row["question"]).lower()
        if q in text or text in q:
            return row["answer"]

    # ---------- 3. KEYWORD MATCH ----------
    user_key = normalize(text)

    best_score = 0
    best_answer = None

    for _, row in df.iterrows():
        key_words = str(row["key"]).split()
        score = sum(1 for w in user_key.split() if w in key_words)

        if score > best_score:
            best_score = score
            best_answer = row["answer"]

    if best_score > 0:
        return best_answer

    # ---------- 4. FINAL FALLBACK ----------
    return (
        "I didn’t understand that 🤔\n\n"
        "You can ask me about:\n"
        "• GEHU courses\n"
        "• Fees structure\n"
        "• Campus details\n"
        "• Hostel facilities\n"
        "• Admissions & placements"
    )

# ===================== ROUTES =====================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/apply")
def apply():
    return render_template("apply.html")

@app.route('/contact.html')
def contact():
    return render_template('contact.html')

@app.route('/about.html')
def about():
    return render_template('about.html')

@app.route('/courses.html')
def courses():
    return render_template('courses.html')

@app.route('/d.html')
def d():
    return render_template('d.html')

@app.route('/h.html')
def h():
    return render_template('h.html')

@app.route('/b.html')
def b():
    return render_template('b.html')


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    user_msg = data.get("msg", "")
    reply = get_answer(user_msg)
    return jsonify({"reply": reply})


# ===================== RUN SERVER =====================
if __name__ == "__main__":
    app.run(debug=True)
