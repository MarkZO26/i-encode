import React from 'react';

// Gagawa tayo ng "Props" interface para sa title
interface DashboardProps {
  title?: string; // Optional ito para hindi mag-error kung walang maipasa
}

const Dashboard: React.FC<DashboardProps> = ({ title }) => {
  return (
    <div>
      {/* Gagamit tayo ng fallback: kung walang 'title', "Dashboard Overview" ang lalabas */}
      <h2>{title || "Dashboard Overview"}</h2>
      <p>Ito ang data para sa mainDashboard folder structure mo.</p>
    </div>
  );
};

export default Dashboard;