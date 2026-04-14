import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import EmailSent from '@/components/auth/EmailSent';
import VerifyEmail from '@/components/auth/VerifyEmail';
import Login from '@/components/auth/Login';

const Router: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/email-sent" element={<EmailSent />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Routes>
  </BrowserRouter>
);

export default Router;
