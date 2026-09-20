# FinTrack

A personal finance dashboard for tracking income, expenses, savings, and goals — built with React (Vite), Flask, and MySQL.

## Features

- **Dashboard** — income/expense/savings summary, a savings trend chart with hover tooltips, and recent transactions
- **Transactions** — add, view, and delete income/expense entries, all stored in MySQL
- **Analysis** — income vs. expense comparison, top expenses, and a month-by-month expense breakdown
- **Goals** — set savings goals with a target amount, log contributions toward them, and track status (Not started / In progress / Completed)

All data is entered by the user — nothing is hardcoded or seeded; the app starts empty.

## Tech stack

| Layer     | Tech                          |
|-----------|--------------------------------|
| Frontend  | React, Vite, plain CSS        |
| Backend   | Flask (Python)                |
| Database  | MySQL                         |

## Project structure

```
newProject/
├── frontend/               # React app (Vite)
│   └── src/
│       ├── components/     # Sidebar, SummaryCard, TransactionList, TrendChart, AddTransactionForm
│       ├── pages/          # Dashboard, Transactions, Analysis, Goals
│       ├── services/       # api.js - talks to the Flask backend
│       ├── App.jsx
│       └── index.css
└── py/                      # Flask backend
    ├── app.py               # routes
    ├── config.py            # reads .env
    ├── db.py                # MySQL connection helper
    ├── schema.sql           # database schema (no seed data)
    ├── requirements.txt
    └── .env.example
```

## Setup

### 1. Database

Create the database and tables:

```bash
mysql -u root -p < py/schema.sql
```

(Or run `py/schema.sql` through MySQL Workbench: **File → Open SQL Script... → Execute**.)

### 2. Backend

```bash
cd py
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
copy .env.example .env       # then edit .env with your real MySQL password
python app.py
```

Backend runs at `http://localhost:8000`. Confirm it's working: visit `http://localhost:8000/api/health` — it should return `{"status": "ok"}`.

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API reference

| Method | Route                        | Description                          |
|--------|-------------------------------|---------------------------------------|
| GET    | `/api/health`                 | Health check                          |
| GET    | `/api/summary`                | Income/expense/savings for the month  |
| GET    | `/api/trend`                  | Cumulative savings, one point/txn     |
| GET    | `/api/transactions?limit=N`   | List transactions                     |
| POST   | `/api/transactions`           | Create a transaction                  |
| DELETE | `/api/transactions/<id>`      | Delete a transaction                  |
| GET    | `/api/goals`                  | List goals                            |
| POST   | `/api/goals`                  | Create a goal                         |
| PATCH  | `/api/goals/<id>`             | Update a goal (status, amount, etc.)  |
| DELETE | `/api/goals/<id>`             | Delete a goal                         |

## Notes

- `.env` is git-ignored — never commit real database credentials. Use `.env.example` as the template.
- This is a local development setup with no authentication — anyone with access to the running app can add/delete data. Not intended for public deployment as-is.
