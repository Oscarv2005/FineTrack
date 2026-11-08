import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getTransactions, formatTransaction } from "../services/api.js";

export default function Analysis() {
  const [transactions, setTransactions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [closedMonths, setClosedMonths] = useState(new Set());

  useEffect(() => {
    getTransactions()
      .then((data) => {
        setTransactions(data);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, []);

  const { totalIncome, totalExpense, topExpenses, monthlyGroups } =
    useMemo(() => {
      let income = 0;
      let expense = 0;
      const groups = {};

      for (const t of transactions) {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;

        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!groups[key]) {
          groups[key] = {
            key,
            label: d.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            }),
            income: 0,
            expense: 0,
            transactions: [],
          };
        }
        if (t.type === "income") groups[key].income += t.amount;
        else groups[key].expense += t.amount;
        groups[key].transactions.push(t);
      }

      const expenses = transactions
        .filter((t) => t.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const sortedGroups = Object.values(groups).sort((a, b) =>
        b.key.localeCompare(a.key),
      );

      return {
        totalIncome: income,
        totalExpense: expense,
        topExpenses: expenses,
        monthlyGroups: sortedGroups,
      };
    }, [transactions]);

  const maxValue = Math.max(totalIncome, totalExpense, 1);
  const format = (n) => `₹${n.toLocaleString("en-IN")}`;

  const toggleMonth = (key) => {
    setClosedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Analysis</h1>
        </div>
        <p className="empty-state">
          Couldn't reach the backend. Make sure Flask is running and try
          refreshing.
        </p>
      </div>
    );
  }

  if (loaded && transactions.length === 0) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Analysis</h1>
        </div>
        <div className="section-card">
          <p className="empty-state">
            Add some transactions to see your income vs expense breakdown here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Analysis</h1>
      </div>

      <div className="section-card">
        <div className="section-header">Income vs Expense</div>
        <div className="compare-bars">
          <div className="compare-row">
            <span className="compare-label">Income</span>
            <div className="compare-track">
              <div
                className="compare-fill income"
                style={{ width: `${(totalIncome / maxValue) * 100}%` }}
              />
            </div>
            <span className="compare-value text-income">
              {format(totalIncome)}
            </span>
          </div>
          <div className="compare-row">
            <span className="compare-label">Expense</span>
            <div className="compare-track">
              <div
                className="compare-fill expense"
                style={{ width: `${(totalExpense / maxValue) * 100}%` }}
              />
            </div>
            <span className="compare-value text-expense">
              {format(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">Top expenses</div>
        {topExpenses.length === 0 ? (
          <p className="empty-state">No expenses recorded yet.</p>
        ) : (
          <ul className="transaction-list">
            {topExpenses.map((t, i) => (
              <li
                key={t.id}
                className={`transaction-item ${i !== topExpenses.length - 1 ? "border-bottom" : ""}`}
              >
                <span className="transaction-name">{t.name}</span>
                <span className="transaction-amount text-expense">
                  -{format(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">Monthly breakdown</div>
        <div className="month-list">
          {monthlyGroups.map((group) => {
            const isOpen = !closedMonths.has(group.key);
            return (
              <div key={group.key} className="month-group">
                <button
                  className="month-group-header"
                  onClick={() => toggleMonth(group.key)}
                >
                  <span className="month-group-label">{group.label}</span>
                  <div className="month-group-totals">
                    <span className="month-group-income">
                      +{format(group.income)}
                    </span>
                    <span className="month-group-expense">
                      -{format(group.expense)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`month-group-chevron ${isOpen ? "open" : ""}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <ul className="transaction-list month-group-transactions">
                    {group.transactions.map((t, i) => {
                      const formatted = formatTransaction(t);
                      const amountClass =
                        t.type === "expense" ? "text-expense" : "text-income";
                      return (
                        <li
                          key={t.id}
                          className={`transaction-item ${i !== group.transactions.length - 1 ? "border-bottom" : ""}`}
                        >
                          <span className="transaction-name">{t.name}</span>
                          <span className={`transaction-amount ${amountClass}`}>
                            {formatted.amount}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
