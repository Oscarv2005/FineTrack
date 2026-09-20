from datetime import date

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config
from db import get_connection

app = Flask(__name__)
CORS(app) 

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/summary")
def get_summary():
    """Income, expense, and savings for the current calendar month."""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
        FROM transactions
        WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
        """
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    income = float(row["income"])
    expense = float(row["expense"])
    return jsonify({"income": income, "expense": expense, "savings": income - expense})


@app.route("/api/trend")
def get_trend():
    """Cumulative savings over time, one point per transaction
    (not per calendar date) so it works even if several transactions
    happen on the same day."""
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """
        SELECT CASE WHEN type = 'income' THEN amount ELSE -amount END AS net
        FROM transactions
        ORDER BY date ASC, id ASC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    cumulative = 0
    trend = []
    for row in rows:
        cumulative += float(row["net"])
        trend.append(round(cumulative, 2))

    return jsonify(trend)


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    limit = request.args.get("limit", type=int)

    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    query = "SELECT id, name, amount, type, date FROM transactions ORDER BY date DESC, id DESC"
    if limit:
        query += " LIMIT %s"
        cur.execute(query, (limit,))
    else:
        cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    for row in rows:
        row["amount"] = float(row["amount"])
        row["date"] = row["date"].strftime("%Y-%m-%d")

    return jsonify(rows)


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    amount = data.get("amount")
    txn_type = data.get("type")
    txn_date = data.get("date", date.today().isoformat())

    if not name or amount is None or txn_type not in ("income", "expense"):
        return (
            jsonify({"error": "Fields required: name (string), amount (number), type ('income' or 'expense')"}),
            400,
        )

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO transactions (name, amount, type, date) VALUES (%s, %s, %s, %s)",
        (name, amount, txn_type, txn_date),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    conn.close()

    return (
        jsonify({"id": new_id, "name": name, "amount": amount, "type": txn_type, "date": txn_date}),
        201,
    )


@app.route("/api/transactions/<int:txn_id>", methods=["DELETE"])
def delete_transaction(txn_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM transactions WHERE id = %s", (txn_id,))
    conn.commit()
    deleted = cur.rowcount
    cur.close()
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify({"message": "Deleted"}), 200


VALID_GOAL_STATUSES = ("not_started", "in_progress", "completed")


@app.route("/api/goals", methods=["GET"])
def get_goals():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT id, name, target_amount, current_amount, status, created_at "
        "FROM goals ORDER BY created_at DESC, id DESC"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    for row in rows:
        row["target_amount"] = float(row["target_amount"])
        row["current_amount"] = float(row["current_amount"])
        row["created_at"] = row["created_at"].isoformat()

    return jsonify(rows)


@app.route("/api/goals", methods=["POST"])
def add_goal():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    target_amount = data.get("target_amount")
    current_amount = data.get("current_amount", 0)
    status = data.get("status", "not_started")

    if not name or target_amount is None or float(target_amount) <= 0:
        return jsonify({"error": "Fields required: name (string), target_amount (positive number)"}), 400

    if status not in VALID_GOAL_STATUSES:
        return jsonify({"error": f"status must be one of {VALID_GOAL_STATUSES}"}), 400

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO goals (name, target_amount, current_amount, status) VALUES (%s, %s, %s, %s)",
        (name, target_amount, current_amount, status),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.close()
    conn.close()

    return (
        jsonify(
            {
                "id": new_id,
                "name": name,
                "target_amount": float(target_amount),
                "current_amount": float(current_amount),
                "status": status,
            }
        ),
        201,
    )


@app.route("/api/goals/<int:goal_id>", methods=["PATCH"])
def update_goal(goal_id):
    """Partial update - send only the fields you want to change,
    e.g. { "status": "in_progress" } or { "current_amount": 5000 }."""
    data = request.get_json(silent=True) or {}

    fields = []
    values = []

    if "name" in data:
        fields.append("name = %s")
        values.append(data["name"])
    if "target_amount" in data:
        fields.append("target_amount = %s")
        values.append(data["target_amount"])
    if "current_amount" in data:
        fields.append("current_amount = %s")
        values.append(data["current_amount"])
    if "status" in data:
        if data["status"] not in VALID_GOAL_STATUSES:
            return jsonify({"error": f"status must be one of {VALID_GOAL_STATUSES}"}), 400
        fields.append("status = %s")
        values.append(data["status"])

    if not fields:
        return jsonify({"error": "No valid fields to update"}), 400

    values.append(goal_id)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(f"UPDATE goals SET {', '.join(fields)} WHERE id = %s", values)
    conn.commit()
    updated = cur.rowcount
    cur.close()
    conn.close()

    if updated == 0:
        return jsonify({"error": "Goal not found"}), 404
    return jsonify({"message": "Updated"}), 200


@app.route("/api/goals/<int:goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM goals WHERE id = %s", (goal_id,))
    conn.commit()
    deleted = cur.rowcount
    cur.close()
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Goal not found"}), 404
    return jsonify({"message": "Deleted"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=Config.PORT)