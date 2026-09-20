import React, { useState, useEffect } from "react";
import {
  Landmark,
  LayoutGrid,
  List,
  PieChart,
  Target,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "transactions", label: "Transactions", icon: List },
  { id: "analysis", label: "Analysis", icon: PieChart },
  { id: "goals", label: "Goals", icon: Target },
];

export default function Sidebar({
  activeItem = "dashboard",
  onNavigate = () => {},
}) {
  const [active, setActive] = useState(activeItem);

  // Keep internal state in sync if the parent ever changes activeItem itself
  useEffect(() => {
    setActive(activeItem);
  }, [activeItem]);

  const handleClick = (id) => {
    setActive(id);
    onNavigate(id);
  };

  return (
    <aside className="sidebar">
      <div>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Landmark size={19} strokeWidth={2.2} />
          </div>
          <span className="sidebar-brand-name">FinTrack</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => handleClick(id)}
                className={`sidebar-item${isActive ? " active" : ""}`}
              >
                {isActive && <span className="sidebar-item-indicator" />}
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings pinned to bottom */}
      <div className="sidebar-footer">
        <button
          onClick={() => handleClick("settings")}
          className={`sidebar-item${active === "settings" ? " active" : ""}`}
        >
          {active === "settings" && <span className="sidebar-item-indicator" />}
          <Settings size={18} strokeWidth={2} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
