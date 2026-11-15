'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { DashboardUser, LoginRequest } from '@/lib/types';
import { api } from '@/lib/api';

interface LoginViewProps {
  onLoginSuccess: (user: DashboardUser, token: string) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const creds: LoginRequest = {
      username: username.trim(),
      password: password.trim(),
    };

    if (!creds.username || !creds.password) {
      setErrorMsg('Username dan kata sandi wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(creds);
      localStorage.setItem('token', res.token);
      localStorage.setItem('dashboard_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: unknown) {
      let msg = 'Login gagal. Periksa username dan password Anda.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else if (err && typeof err === 'object') {
        const obj = err as Record<string, unknown>;
        msg = typeof obj.message === 'string' ? obj.message : JSON.stringify(err);
      }
      if (msg === '[object Object]') {
        msg = 'Gagal terhubung ke Backend API. Pastikan server backend aktif dan URL backend telah diatur di Vercel.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-[420px] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Main Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg tracking-wider shadow-md mb-1">
              TOP
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--fg)]">
              Masuk ke Dashboard
            </h1>
            <p className="text-xs text-[var(--fg3)] max-w-xs mx-auto">
              Silakan masukkan kredensial akun Anda untuk mengakses portal manajemen project
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Clean Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--fg2)] mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan username atau email..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-xs text-[var(--fg)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-[var(--fg3)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--fg2)] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-xs text-[var(--fg)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-[var(--fg3)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--fg3)] hover:text-[var(--fg)] transition-colors"
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[var(--fg2)] select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Minimal Footer */}
        <div className="text-center text-[11px] text-[var(--fg3)] space-y-1">
          <div>TOP Project Operations Dashboard &bull; v2.4</div>
          <div className="text-[10px] text-[var(--fg3)] opacity-70">
            Sistem Keamanan Terintegrasi &bull; Multi-Role Access
          </div>
        </div>
      </div>
    </div>
  );
}
