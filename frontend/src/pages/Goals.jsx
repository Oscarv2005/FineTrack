import React, { useCallback, useEffect, useState } from "react";
import { getGoals, addGoal, updateGoal, deleteGoal } from "../services/api.js";

const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function GoalCard({ goal, onAddFunds, onStatusChange, onDelete }) {
  const [fundsInput, setFundsInput] = useState("");
  const [adding, setAdding] = useState(false);

  const progress = Math.min(
    100,
    (goal.current_amount / goal.target_amount) * 100,
  );

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = Number(fundsInput);
    if (!amount || amount <= 0) return;

    setAdding(true);
    await onAddFunds(goal, amount);
    setFundsInput("");
    setAdding(false);
  };

  return (
    <div className="goal-card">
      <div className="goal-card-top">
        <span className="goal-name">{goal.name}</span>
        <button
          className="goal-delete"
          onClick={() => onDelete(goal.id)}
          aria-label="Delete goal"
        >
          ✕
        </button>
      </div>

      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="goal-card-bottom">
        <span className="goal-amounts">
          ₹{goal.current_amount.toLocaleString("en-IN")} / ₹
          {goal.target_amount.toLocaleString("en-IN")}
        </span>
        <select
          className={`goal-status-select status-${goal.status}`}
          value={goal.status}
          onChange={(e) => onStatusChange(goal.id, e.target.value)}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <form className="goal-funds-form" onSubmit={handleAddFunds}>
        <input
          type="number"
          placeholder="Amount to add"
          value={fundsInput}
          onChange={(e) => setFundsInput(e.target.value)}
          className="form-input form-input-amount"
          min="0"
          step="0.01"
        />
        <button type="submit" className="goal-funds-submit" disabled={adding}>
          {adding ? "Adding..." : "+ Add funds"}
        </button>
      </form>
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState(false);

  // Add-goal form state
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadGoals = useCallback(() => {
    getGoals()
      .then((data) => {
        setGoals(data);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !target || Number(target) <= 0) {
      setFormError("Enter a goal name and a positive target amount.");
      return;
    }

    setSaving(true);
    try {
      await addGoal({ name: name.trim(), target_amount: Number(target) });
      setName("");
      setTarget("");
      loadGoals();
    } catch {
      setFormError("Could not save. Is the backend running?");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (goalId, status) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status } : g)),
    );
    try {
      await updateGoal(goalId, { status });
    } catch {
      loadGoals();
    }
  };

  const handleAddFunds = async (goal, amount) => {
    const newAmount = Math.min(
      goal.target_amount,
      goal.current_amount + amount,
    );
    // Reaching the target auto-completes the goal; any progress from
    // "not started" moves it to "in progress" - both feel obvious to the user.
    let newStatus = goal.status;
    if (newAmount >= goal.target_amount) newStatus = "completed";
    else if (goal.status === "not_started") newStatus = "in_progress";

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, current_amount: newAmount, status: newStatus }
          : g,
      ),
    );

    try {
      await updateGoal(goal.id, {
        current_amount: newAmount,
        status: newStatus,
      });
    } catch {
      loadGoals();
    }
  };

  const handleDelete = async (goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      await deleteGoal(goalId);
    } catch {
      loadGoals();
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Goals</h1>
      </div>

      {error && (
        <p className="empty-state">
          Couldn't reach the backend. Make sure Flask is running and try
          refreshing.
        </p>
      )}

      <div className="section-card">
        <div className="section-header">Add a goal</div>
        <form className="add-transaction-form" onSubmit={handleAddGoal}>
          <input
            type="text"
            placeholder="Goal name (e.g. Emergency fund)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
          <input
            type="number"
            placeholder="Target amount"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="form-input form-input-amount"
            min="0"
            step="0.01"
          />
          <button type="submit" className="form-submit" disabled={saving}>
            {saving ? "Adding..." : "Add"}
          </button>
          {formError && <p className="form-error">{formError}</p>}
        </form>
      </div>

      <div className="section-card">
        <div className="section-header">Your goals</div>
        {goals.length === 0 ? (
          <p className="empty-state">
            No goals yet. Add one above to start tracking.
          </p>
        ) : (
          <div className="goal-list">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddFunds={handleAddFunds}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
