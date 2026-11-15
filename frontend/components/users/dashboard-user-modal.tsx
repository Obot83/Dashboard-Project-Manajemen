'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { DashboardUser, DashboardRole, CreateDashboardUserRequest, UpdateDashboardUserRequest } from '@/lib/types';
import { api } from '@/lib/api';

interface DashboardUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: DashboardUser | null;
  onSaved: () => void;
}

export function DashboardUserModal({
  isOpen,
  onClose,
  userToEdit,
  onSaved,
}: DashboardUserModalProps) {
  const isEditing = Boolean(userToEdit);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<DashboardRole>('member');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setFullName(userToEdit.full_name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setIsActive(userToEdit.is_active);
      setPassword('');
    } else {
      setUsername('');
      setFullName('');
      setEmail('');
      setRole('member');
      setIsActive(true);
      setPassword('');
    }
    setErrorMsg(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isEditing && !username.trim()) {
      setErrorMsg('Username wajib diisi');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Email yang valid wajib diisi');
      return;
    }
    if (!isEditing && !password.trim()) {
      setErrorMsg('Kata sandi awal wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && userToEdit) {
        const payload: UpdateDashboardUserRequest = {
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          is_active: isActive,
          password: password ? password : undefined,
        };
        await api.updateDashboardUser(userToEdit.id, payload);
      } else {
        const payload: CreateDashboardUserRequest = {
          username: username.trim(),
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          password: password.trim(),
          is_active: isActive,
        };
        await api.createDashboardUser(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--fg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-[var(--fg)]">
                {isEditing ? `Edit Akun Dashboard: ${userToEdit?.username}` : 'Tambah Akun Login Dashboard'}
              </h2>
              <p className="text-[11px] text-[var(--fg3)]">
                Atur hak akses login, peran (role), dan kredensial pengguna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg3)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
              <input
                type="text"
                required={!isEditing}
                disabled={isEditing}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jdoe atau admin_ops"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            {isEditing && (
              <span className="text-[10px] text-[var(--fg3)] mt-0.5 block">
                Username tidak dapat diubah setelah dibuat.
              </span>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              Alamat Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@teknologioperator.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              Peran / Hak Akses (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as DashboardRole)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="admin">👑 Administrator (Akses Penuh + Kelola Pengguna)</option>
              <option value="pm">💼 Project Manager (Monitoring Project, Workload, Roadmap)</option>
              <option value="member">💻 Anggota Tim / Dev (Tasks & Operasional)</option>
              <option value="viewer">👁️ Viewer / Direksi (Read-only Overview & Laporan)</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              {isEditing ? 'Ganti Kata Sandi (Opsional)' : 'Kata Sandi Awal'}{' '}
              {!isEditing && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
              <input
                type="password"
                required={!isEditing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 6 karakter'}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Status Aktif */}
          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-[var(--fg)]">Akun Aktif</span>
                <p className="text-[10px] text-[var(--fg3)]">
                  Pengguna dapat login dan beraktivitas di dashboard
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] font-medium text-[var(--fg)] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEditing ? 'Simpan Perubahan' : 'Buat Akun'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
