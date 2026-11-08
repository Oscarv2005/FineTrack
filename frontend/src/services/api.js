
const BASE_URL = import.meta.env.VITE_API_BASE_URL || " https://finetrack-in.onrender.com/api";

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


export function getSummary() {
  return request("/summary");
}


export function getTrend() {
  return request("/trend");
}

export function getTransactions({ limit } = {}) {
  const query = limit ? `?limit=${limit}` : "";
  return request(`/transactions${query}`);
}


export function addTransaction({ name, amount, type, date }) {
  return request("/transactions", {
    method: "POST",
    body: JSON.stringify({ name, amount, type, date }),
  });
}

export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: "DELETE" });
}


export function formatTransaction(txn) {
  const sign = txn.type === "expense" ? "-" : "+";
  return {
    ...txn,
    amount: `${sign}₹${Math.abs(txn.amount).toLocaleString("en-IN")}`,
  };
}


export function getGoals() {
  return request("/goals");
}


export function addGoal({ name, target_amount, current_amount = 0, status = "not_started" }) {
  return request("/goals", {
    method: "POST",
    body: JSON.stringify({ name, target_amount, current_amount, status }),
  });
}


export function updateGoal(id, changes) {
  return request(`/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteGoal(id) {
  return request(`/goals/${id}`, { method: "DELETE" });
}
