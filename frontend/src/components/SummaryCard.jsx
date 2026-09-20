import React from "react";

export default function SummaryCard({ title, amount, typeClass }) {
  return (
    <div className="summary-card">
      <div className="card-title">{title}</div>
      <div className={`card-amount ${typeClass}`}>{amount}</div>
    </div>
  );
}
