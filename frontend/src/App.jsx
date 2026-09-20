import React, { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Analysis from "./pages/Analysis.jsx";
import Goals from "./pages/Goals.jsx";
import "./index.css";

function ComingSoon({ title }) {
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{title}</h1>
      </div>
      <div className="section-card">
        <p className="empty-state">This page is coming soon.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "transactions":
        return <Transactions />;
      case "analysis":
        return <Analysis />;
      case "goals":
        return <Goals />;
      default:
        return <ComingSoon title="Settings" />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeItem={activePage} onNavigate={setActivePage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}
