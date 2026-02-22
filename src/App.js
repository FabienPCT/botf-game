// ─────────────────────────────────────────────────────────────
// FILE 3: src/App.js
// Routes /instructor → instructor dashboard, everything else → team
// ─────────────────────────────────────────────────────────────

import React from "react";
import InstructorDashboard from "./InstructorDashboard";
import TeamDashboard from "./TeamDashboard";

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith("/instructor")) return <InstructorDashboard />;
  return <TeamDashboard />;
}

