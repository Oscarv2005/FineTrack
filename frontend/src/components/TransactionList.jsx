import React from "react";

/**
 * onDelete is optional - pass it to show a delete button per row
 * (used on the Transactions page). Omit it for read-only views
 * like the Dashboard's "Recent transactions" preview.
 */
export default function TransactionList({ transactions = [], onDelete }) {
  if (transactions.length === 0) {
    return <p className="empty-state">No transactions yet.</p>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction, index) => {
        const amountClass =
          transaction.type === "expense" ? "text-expense" : "text-income";
        const borderClass =
          index !== transactions.length - 1 ? "border-bottom" : "";

        return (
          <div
            key={transaction.id}
            className={`transaction-item ${borderClass}`}
          >
            <span className="transaction-name">{transaction.name}</span>
            <div className="transaction-right">
              <span className={`transaction-amount ${amountClass}`}>
                {transaction.amount}
              </span>
              {onDelete && (
                <button
                  className="transaction-delete"
                  onClick={() => onDelete(transaction.id)}
                  aria-label={`Delete ${transaction.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
