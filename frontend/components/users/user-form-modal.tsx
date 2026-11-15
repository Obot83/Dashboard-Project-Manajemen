'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Shield, Mail, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { UserItem, CreateUserRequest, UpdateUserRequest } from '@/lib/types';
import { api } from '@/lib/api';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserItem | null;
  onSaved: () => void;
}

export function UserFormModal({
  isOpen,
  onClose,
  userToEdit,
  onSaved,
}: UserFormModalProps) {
  const isEditing = Boolean(userToEdit);

  const [login, setLogin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [admin, setAdmin] = useState(false);
  const [status, setStatus] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setLogin(userToEdit.login);
      setFirstName(userToEdit.firstname);
      setLastName(userToEdit.lastname);
      setEmail(userToEdit.email);
      setAdmin(userToEdit.admin);
      setStatus(userToEdit.status);
      setPassword('');
    } else {
      setLogin('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setAdmin(false);
      setStatus(1);
    }
    setErrorMsg(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isEditing && !login.trim()) {
      setErrorMsg('Username (login) wajib diisi');
      return;
    }
    if (!firstName.trim()) {
      setErrorMsg('Nama Depan wajib diisi');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Email yang valid wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && userToEdit) {
        const payload: UpdateUserRequest = {
          firstname: firstName.trim(),
          lastname: lastName.trim(),
          email: email.trim(),
          admin,
          status,
          password: password ? password : undefined,
        };
        await api.updateUser(userToEdit.id, payload);
      } else {
        const payload: CreateUserRequest = {
          login: login.trim(),
          firstname: firstName.trim(),
          lastname: lastName.trim(),
          email: email.trim(),
          admin,
          status,
          password: password ? password : undefined,
        };
        await api.createUser(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data pengguna');
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
              {isEditing ? <UserCheck size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-[var(--fg)]">
                {isEditing ? `Edit Pengguna: ${userToEdit?.name}` : 'Tambah Pengguna Baru'}
              </h2>
              <p className="text-[11px] text-[var(--fg3)]">
                {isEditing
                  ? 'Perbarui informasi profil, hak akses admin, dan status akun'
                  : 'Daftarkan pengguna baru ke dalam database'}
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

          {/* Username / Login */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              Username (Login) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required={!isEditing}
              disabled={isEditing}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="e.g. jdoe atau john.doe"
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            />
            {isEditing && (
              <span className="text-[10px] text-[var(--fg3)] mt-0.5 block">
                Username tidak dapat diubah setelah dibuat.
              </span>
            )}
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[var(--fg2)] mb-1">
                Nama Depan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. John"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--fg2)] mb-1">
                Nama Belakang
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
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

          {/* Password */}
          <div>
            <label className="block font-semibold text-[var(--fg2)] mb-1">
              {isEditing ? 'Ganti Kata Sandi (Opsional)' : 'Kata Sandi Awal (Opsional)'}
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg3)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password aman'}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Status & Role Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
            <div>
              <label className="block font-semibold text-[var(--fg2)] mb-1">
                Status Akun
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={1}>🟢 Aktif</option>
                <option value={4}>🟡 Terundang (Invited)</option>
                <option value={3}>🔴 Dinonaktifkan (Locked)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="font-semibold text-[var(--fg2)] mb-1 block">
                Hak Administrator
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors select-none">
                <input
                  type="checkbox"
                  checked={admin}
                  onChange={(e) => setAdmin(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--fg)]">
                  <Shield size={13} className={admin ? 'text-purple-600' : 'text-[var(--fg3)]'} />
                  <span>Jadikan Admin Global</span>
                </div>
              </label>
            </div>
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
                <span>{isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
