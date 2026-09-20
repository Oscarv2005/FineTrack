import React, { useState } from "react";
import { addTransaction } from "../services/api.js";

export default function AddTransactionForm({ onAdded = () => {} }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !amount || Number(amount) <= 0) {
      setError("Enter a name and a positive amount.");
      return;
    }

    setSaving(true);
    try {
      await addTransaction({ name: name.trim(), amount: Number(amount), type });
      setName("");
      setAmount("");
      setType("expense");
      onAdded();
    } catch (err) {
      setError("Could not save. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="add-transaction-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Transaction name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="form-input"
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="form-input form-input-amount"
        min="0"
        step="0.01"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="form-select"
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <button type="submit" className="form-submit" disabled={saving}>
        {saving ? "Adding..." : "Add"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
