import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import SummaryCard from "../components/SummaryCard.jsx";
import TrendChart from "../components/TrendChart.jsx";
import TransactionList from "../components/TransactionList.jsx";
import {
  getSummary,
  getTrend,
  getTransactions,
  formatTransaction,
} from "../services/api.js";

export default function Dashboard() {
  const [summary, setSummary] = useState({ income: 0, expense: 0, savings: 0 });
  const [trend, setTrend] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setError(true));

    getTrend()
      .then(setTrend)
      .catch(() => setError(true));

    getTransactions({ limit: 5 })
      .then((data) => setTransactions(data.map(formatTransaction)))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dropdown-container">
          <select className="date-dropdown">
            <option>This month</option>
          </select>
          <ChevronDown className="dropdown-icon" size={16} strokeWidth={2} />
        </div>
      </div>

      {error && (
        <p className="empty-state">
          Couldn't reach the backend. Make sure Flask is running and try
          refreshing.
        </p>
      )}

      <div className="summary-cards">
        <SummaryCard
          title="Income"
          amount={`₹${summary.income.toLocaleString("en-IN")}`}
          typeClass="text-income"
        />
        <SummaryCard
          title="Expense"
          amount={`₹${summary.expense.toLocaleString("en-IN")}`}
          typeClass="text-expense"
        />
        <SummaryCard
          title="Savings"
          amount={`₹${summary.savings.toLocaleString("en-IN")}`}
          typeClass="text-savings"
        />
      </div>

      <TrendChart title="Savings trend" data={trend} />

      <div className="section-card">
        <div className="section-header">Recent transactions</div>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
