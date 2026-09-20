// Base URL for your Python backend (FastAPI/Flask/Django, etc.)
// Override by creating a .env file at the project root with:
// VITE_API_BASE_URL=http://localhost:8000/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

/** Expected response: { income: number, expense: number, savings: number } */
export function getSummary() {
  return request("/summary");
}

/** Expected response: number[] — savings values over time, oldest first */
export function getTrend() {
  return request("/trend");
}

/** Expected response: { id, name, amount, type }[] */
export function getTransactions({ limit } = {}) {
  const query = limit ? `?limit=${limit}` : "";
  return request(`/transactions${query}`);
}

/** Creates a new transaction. Body: { name, amount, type, date? } */
export function addTransaction({ name, amount, type, date }) {
  return request("/transactions", {
    method: "POST",
    body: JSON.stringify({ name, amount, type, date }),
  });
}

/** Deletes a transaction by id */
export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: "DELETE" });
}

/**
 * Converts a raw backend transaction { amount: 1250, type: "expense" }
 * into the display shape TransactionList.jsx expects:
 * { amount: "-₹1,250", type: "expense" }
 */
export function formatTransaction(txn) {
  const sign = txn.type === "expense" ? "-" : "+";
  return {
    ...txn,
    amount: `${sign}₹${Math.abs(txn.amount).toLocaleString("en-IN")}`,
  };
}

/** Expected response: { id, name, target_amount, current_amount, status, created_at }[] */
export function getGoals() {
  return request("/goals");
}

/** Creates a new goal. Body: { name, target_amount, current_amount?, status? } */
export function addGoal({ name, target_amount, current_amount = 0, status = "not_started" }) {
  return request("/goals", {
    method: "POST",
    body: JSON.stringify({ name, target_amount, current_amount, status }),
  });
}

/** Partial update - pass only the fields you want to change. */
export function updateGoal(id, changes) {
  return request(`/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteGoal(id) {
  return request(`/goals/${id}`, { method: "DELETE" });
}