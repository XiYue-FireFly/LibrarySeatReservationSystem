/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from './views/Auth';
import { LabList } from './views/LabList';
import { Reservation } from './views/Reservation';
import { Profile } from './views/Profile';
import { Success } from './views/Success';
import { EditProfile } from './views/EditProfile';
import { Feedback } from './views/Feedback';
import { AuthProvider, useAuth } from './store/auth';

/** 路由守卫：未登录则跳转到登录页 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/labs" element={<PrivateRoute><LabList /></PrivateRoute>} />
      <Route path="/reservation/:id" element={<PrivateRoute><Reservation /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/feedback" element={<PrivateRoute><Feedback /></PrivateRoute>} />
      <Route path="/success" element={<PrivateRoute><Success /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
