import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage        from '../pages/LoginPage';
import SignUpPage       from '../pages/SignUp';
import NavigationSideBar from '../pages/mainDashbaord/NavigationSideBar';

// ─── Protected Route Middleware ───────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ─── App Routes ───────────────────────────────────────────────
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected — kailangan naka-login */}
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute>
              <NavigationSideBar />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;