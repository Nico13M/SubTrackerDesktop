import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import EmailSent from '@/components/auth/EmailSent';
import VerifyEmail from '@/components/auth/VerifyEmail';
import Login from '@/components/auth/Login';
import ForgotPassword from '@/components/auth/ForgotPassword';
import PasswordResetSent from '@/components/auth/PasswordResetSent';
import ResetPassword from '@/components/auth/ResetPassword';

const Router: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/password-reset-sent" element={<PasswordResetSent />} />
      <Route path="/email-sent" element={<EmailSent />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Routes>
  </BrowserRouter>
);

export default Router;
