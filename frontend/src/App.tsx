import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MfaVerifyPage } from './pages/MfaVerifyPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { VaultPage } from './pages/VaultPage';
import { PasswordGeneratorPage } from './pages/PasswordGeneratorPage';
import { PasswordAnalyzerPage } from './pages/PasswordAnalyzerPage';
import { SecurityPage } from './pages/SecurityPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShareCreatePage } from './pages/ShareCreatePage';
import { ShareViewPage } from './pages/ShareViewPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mfa-verify" element={<MfaVerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/share/:shareId" element={<ShareViewPage />} />

            {/* Protected Dashboard Layout */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vault" element={<VaultPage />} />
              <Route path="/share-secret" element={<ShareCreatePage />} />
              <Route path="/password-generator" element={<PasswordGeneratorPage />} />
              <Route path="/password-analyzer" element={<PasswordAnalyzerPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/sessions" element={<Navigate to="/security" replace />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};


export default App;
