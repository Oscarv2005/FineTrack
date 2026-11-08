import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getTransactions, formatTransaction } from "../services/api.js";

const W = 440;
const H = 240;
const PL = 40;
const PR = 6;
const PT = 12;
const PB = 28;

const compact = (n) =>
  n >= 1e5
    ? `${+(n / 1e5).toFixed(1)}L`
    : n >= 1e3
      ? `${+(n / 1e3).toFixed(1)}k`
      : `${Math.round(n)}`;

const inrM = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** groups: [{ key: "2026-11", income, expense }], newest first */
function MonthlyChart({ groups = [] }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(
    () =>
      groups
        .slice(0, 6)
        .reverse()
        .map((g) => ({
          key: g.key,
          label: new Date(`${g.key}-01T00:00:00`).toLocaleDateString("en-IN", {
            month: "short",
          }),
          income: g.income,
          expense: g.expense,
        })),
    [groups],
  );

  if (!data.length) return <p className="empty-state">No monthly data yet.</p>;

  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const mag = 10 ** Math.floor(Math.log10(max));
  const top = (Math.ceil((max / mag) * 2) / 2) * mag;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const groupW = innerW / data.length;
  const barW = Math.min(22, groupW * 0.28);
  const y = (v) => PT + innerH - (v / top) * innerH;
  const ticks = [0, top / 2, top];
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="chart-legend">
        <span className="legend-item">
          <i className="legend-dot" style={{ background: "var(--income)" }} />
          Income
        </span>
        <span className="legend-item">
          <i className="legend-dot" style={{ background: "var(--expense)" }} />
          Expense
        </span>
        <span className="chart-readout">
          {active
            ? `${active.label}: ${inrM(active.income)} in, ${inrM(active.expense)} out`
            : "Last 6 months"}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} className="grid-line" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" className="axis-text">
              {compact(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PL + groupW * i + groupW / 2;
          return (
            <g key={d.key}>
              <rect
                x={cx - groupW / 2}
                y={PT}
                width={groupW}
                height={innerH}
                fill={hover === i ? "rgba(18,36,30,0.05)" : "transparent"}
                rx="8"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover(hover === i ? null : i)}
              />
              <rect
                x={cx - barW - 2}
                y={y(d.income)}
                width={barW}
                height={Math.max(0, PT + innerH - y(d.income))}
                rx="4"
                fill="var(--income)"
                pointerEvents="none"
              />
              <rect
                x={cx + 2}
                y={y(d.expense)}
                width={barW}
                height={Math.max(0, PT + innerH - y(d.expense))}
                rx="4"
                fill="var(--expense)"
                pointerEvents="none"
              />
              <text x={cx} y={H - 8} textAnchor="middle" className="axis-text">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const COLORS = ["#1B7F5F", "#F0B030", "#C4432B", "#3E6FB0", "#8A6FB8", "#9AA7A1"];
const inrD = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** items: [{ name, total }] */
function SpendingDonut({ items = [] }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  if (!total) return <p className="empty-state">No expenses recorded yet.</p>;

  let acc = 0;
  const segments = items.map((item, i) => {
    const pct = (item.total / total) * 100;
    const seg = { ...item, pct, offset: 25 - acc, color: COLORS[i % COLORS.length] };
    acc += pct;
    return seg;
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 42 42" className="donut" role="img">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--sunk)" strokeWidth="5" />
        {segments.map((s) => (
          <circle
            key={s.name}
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke={s.color}
            strokeWidth="5"
            strokeDasharray={`${Math.max(s.pct - 0.6, 0.1)} ${100 - Math.max(s.pct - 0.6, 0.1)}`}
            strokeDashoffset={s.offset}
          />
        ))}
        <text x="21" y="20" textAnchor="middle" className="donut-label">Spent</text>
        <text x="21" y="26" textAnchor="middle" className="donut-total">{inrD(total)}</text>
      </svg>

      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.name}>
            <i className="legend-dot" style={{ background: s.color }} />
            <span className="legend-name">{s.name}</span>
            <span className="legend-pct">{Math.round(s.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  const { totalIncome, totalExpense, topExpenses, monthlyGroups, spending } =
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

      const byName = {};
      for (const t of transactions) {
        if (t.type !== "expense") continue;
        const k = t.name.trim().toLowerCase();
        if (!byName[k]) byName[k] = { name: t.name.trim(), total: 0 };
        byName[k].total += t.amount;
      }
      const list = Object.values(byName).sort((x, y) => y.total - x.total);
      const spend = list.slice(0, 5);
      const rest = list.slice(5).reduce((s, x) => s + x.total, 0);
      if (rest > 0) spend.push({ name: "Everything else", total: rest });

      return {
        spending: spend,
        totalIncome: income,
        totalExpense: expense,
        topExpenses: expenses,
        monthlyGroups: sortedGroups,
      };
    }, [transactions]);

  const maxValue = Math.max(totalIncome, totalExpense, 1);
  const format = (n) => `₹${n.toLocaleString("en-IN")}`;

  const net = totalIncome - totalExpense;
  const rate = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : null;
  const signed = (n) => `${n < 0 ? "-" : ""}${format(Math.abs(n))}`;

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

      <div className="stat-row">
        <div className="stat-tile">
          <span className="stat-label">Net savings</span>
          <span className={`stat-value ${net < 0 ? "text-expense" : "text-income"}`}>
            {signed(net)}
          </span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Savings rate</span>
          <span className="stat-value">{rate === null ? "-" : `${rate}%`}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Biggest expense</span>
          <span className="stat-value">
            {topExpenses[0] ? format(topExpenses[0].amount) : "-"}
          </span>
        </div>
      </div>

      <div className="analysis-grid">
        <div className="section-card">
          <div className="section-header">Income and expense by month</div>
          <MonthlyChart groups={monthlyGroups} />
        </div>
        <div className="section-card">
          <div className="section-header">Where your money went</div>
          <SpendingDonut items={spending} />
        </div>
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
