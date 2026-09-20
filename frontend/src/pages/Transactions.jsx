import React, { useCallback, useEffect, useState } from "react";
import TransactionList from "../components/TransactionList.jsx";
import AddTransactionForm from "../components/AddTransactionForm.jsx";
import {
  getTransactions,
  formatTransaction,
  deleteTransaction,
} from "../services/api.js";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(false);

  const loadTransactions = useCallback(() => {
    getTransactions()
      .then((data) => {
        setTransactions(data.map(formatTransaction));
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = async (id) => {
    // Remove it from view immediately; put it back if the delete fails
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransaction(id);
    } catch {
      loadTransactions();
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Transactions</h1>
      </div>

      {error && (
        <p className="empty-state">
          Couldn't reach the backend. Make sure Flask is running and try
          refreshing.
        </p>
      )}

      <div className="section-card">
        <div className="section-header">Add a transaction</div>
        <AddTransactionForm onAdded={loadTransactions} />
      </div>

      <div className="section-card">
        <div className="section-header">All transactions</div>
        <TransactionList transactions={transactions} onDelete={handleDelete} />
      </div>
    </div>
  );
}
