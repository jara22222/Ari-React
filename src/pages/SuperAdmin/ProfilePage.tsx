// ==========================================
// ProfilePage.tsx — Super Admin Profile
// Personal account & UI preferences management.
//
// Sections:
//   1. Profile Info (avatar, name, email, role, scope)
//   2. Change Password (with strength indicator)
//   3. Appearance Settings (Light / Dark mode)
//   4. Security (2FA, sessions)
//   5. Logout
//
// Reusable UI: Card, PageModal, ConfirmationModal, Toast,
//   InputGroup, SecondaryButton, PrimaryButton, ThemeSelector,
//   SessionCard, ToggleSwitch
// ==========================================

import { useState, useEffect, useMemo } from "react";

// --- Layout ---
import MainLayout from "../../layout/MainLayout";

// --- Icons ---
import {
  Mail,
  Shield,
  Globe,
  Clock,
  Edit3,
  Lock,
  Smartphone,
  Monitor,
  KeyRound,
  User,
  Camera,
  Save,
  LogOut,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
} from "lucide-react";

// --- Reusable UI Components ---
import { Card } from "../../components/ui/Card";
import SecondaryButton from "../../components/ui/SecondaryButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ToggleSwitch from "../../components/ui/ToggleSwitch";
import ThemeSelector from "../../components/ui/ThemeSelector";
import type { ThemeOption } from "../../components/ui/ThemeSelector";
import SessionCard from "../../components/ui/SessionCard";
import type { SessionData } from "../../components/ui/SessionCard";
import PageModal from "../../components/ui/PageModal";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import Toast from "../../components/ui/Toast";
import InputGroup from "../../components/ui/InputGroup";

// ==========================================
// DEFAULT DATA
// ==========================================

const DEFAULT_USER = {
  name: "Alexandra Hamilton",
  initials: "AH",
  email: "alex.hamilton@erp-admin.com",
  role: "Super Admin",
  scope: "Global (All Branches)",
  lastLogin: "Feb 13, 2026 at 09:45 AM",
  joinedDate: "Jan 10, 2025",
  avatarUrl: null as string | null,
};

const MOCK_SESSIONS: SessionData[] = [
  { id: "ses-01", device: "Chrome on Windows", location: "Davao City, PH", ip: "192.168.1.45", lastActive: "Now", current: true },
  { id: "ses-02", device: "Safari on iPhone 15", location: "Davao City, PH", ip: "112.203.x.x", lastActive: "2 hours ago", current: false },
  { id: "ses-03", device: "Firefox on MacOS", location: "Cebu City, PH", ip: "124.100.x.x", lastActive: "Feb 12, 2026", current: false },
];

// ==========================================
// HELPERS
// ==========================================

const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const applyThemeToDOM = (theme: ThemeOption) => {
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
};

/** Password strength calculator */
const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
  if (!password) return { level: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 1, label: "Weak", color: "bg-rose-500" };
  if (score <= 2) return { level: 2, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { level: 3, label: "Good", color: "bg-blue-500" };
  return { level: 4, label: "Strong", color: "bg-emerald-500" };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

function ProfilePage() {
  // --- User state ---
  const [user, setUser] = useState({ ...DEFAULT_USER });
  const [theme, setTheme] = useState<ThemeOption>("light");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>(MOCK_SESSIONS);

  // --- Edit Profile modal ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- Change Password modal ---
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- Toast & Confirm ---
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; title: string; message: string;
    action: () => void; variant: "primary" | "danger"; confirmText: string;
  }>({ isOpen: false, title: "", message: "", action: () => {}, variant: "primary", confirmText: "Confirm" });

  // --- Password strength ---
  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  // --- Load theme ---
  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as ThemeOption | null;
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    applyThemeToDOM(initial);
  }, []);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    applyThemeToDOM(newTheme);
    setToast({ message: `Theme updated to ${newTheme === "light" ? "Light" : "Dark"} Mode.`, type: "success" });
  };

  // --- Edit Profile ---
  const openEditModal = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditModalOpen(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) { setToast({ message: "Name and email are required.", type: "error" }); return; }
    setIsSaving(true);
    setTimeout(() => {
      setUser((prev) => ({ ...prev, name: editName.trim(), email: editEmail.trim(), initials: getInitials(editName.trim()) }));
      setIsSaving(false);
      setEditModalOpen(false);
      setToast({ message: "Profile updated successfully.", type: "success" });
    }, 800);
  };

  // --- Change Password ---
  const openPasswordModal = () => {
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPasswordModalOpen(true);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) { setToast({ message: "All password fields are required.", type: "error" }); return; }
    if (newPassword !== confirmPassword) { setToast({ message: "New password and confirm password do not match.", type: "error" }); return; }
    if (newPassword.length < 8) { setToast({ message: "Password must be at least 8 characters.", type: "error" }); return; }
    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordModalOpen(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setToast({ message: "Password updated successfully.", type: "success" });
    }, 800);
  };

  // --- Sessions ---
  const handleRevokeSession = (sessionId: string) => {
    setConfirmModal({ isOpen: true, title: "Revoke Session?", message: "This will log out the device immediately.", variant: "danger", confirmText: "Revoke Access", action: () => { setSessions((prev) => prev.filter((s) => s.id !== sessionId)); setConfirmModal((p) => ({ ...p, isOpen: false })); setToast({ message: "Session revoked successfully.", type: "success" }); } });
  };

  const handleRevokeAllSessions = () => {
    setConfirmModal({ isOpen: true, title: "Revoke All Sessions?", message: "This will log you out of all devices except this one.", variant: "danger", confirmText: "Revoke All", action: () => { setSessions((prev) => prev.filter((s) => s.current)); setConfirmModal((p) => ({ ...p, isOpen: false })); setToast({ message: "All other sessions have been revoked.", type: "success" }); } });
  };

  // --- 2FA ---
  const handleToggle2FA = () => {
    if (twoFactorEnabled) {
      setConfirmModal({ isOpen: true, title: "Disable 2FA?", message: "Disabling Two-Factor Authentication reduces account security. Are you sure?", variant: "danger", confirmText: "Disable", action: () => { setTwoFactorEnabled(false); setConfirmModal((p) => ({ ...p, isOpen: false })); setToast({ message: "2FA has been disabled.", type: "error" }); } });
    } else {
      setTwoFactorEnabled(true);
      setToast({ message: "2FA enabled successfully.", type: "success" });
    }
  };

  // --- Logout ---
  const handleLogout = () => {
    setConfirmModal({ isOpen: true, title: "Log Out?", message: "Are you sure you want to log out? Your session will be cleared and you will be redirected to the login page.", variant: "danger", confirmText: "Log Out", action: () => { setConfirmModal((p) => ({ ...p, isOpen: false })); setToast({ message: "Logging out...", type: "success" }); setTimeout(() => { window.location.href = "/"; }, 1000); } });
  };

  const handleAvatarUpload = () => { setToast({ message: "Avatar upload coming soon!", type: "success" }); };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {/* ---- PAGE HEADER ---- */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profile</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">Manage your profile information, appearance preferences, and security.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-semibold"><Shield size={12} />Super Admin · Global Access</div>
          </div>

          {/* ============================================================
              SECTION 1: PROFILE INFORMATION
              ============================================================ */}
          <Card className="overflow-hidden">
            {/* Banner gradient */}
            <div className="h-28 bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 relative">
              <SecondaryButton onClick={openEditModal} icon={Edit3} className="!absolute !top-4 !right-4 !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !shadow-none !backdrop-blur-sm !text-[11px] !px-3.5 !py-2">Edit Profile</SecondaryButton>
            </div>
            <div className="px-6 md:px-8 pb-6">
              {/* Avatar */}
              <div className="relative -mt-10 mb-5 inline-block group">
                <div className="h-20 w-20 rounded-2xl border-4 border-white bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 shadow-lg overflow-hidden">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : user.initials}
                </div>
                <button onClick={handleAvatarUpload} className="absolute inset-0 rounded-2xl bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" aria-label="Upload avatar"><Camera size={24} className="text-white" /></button>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-left text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider"><Shield size={10} /> {user.role}</span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-left text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider"><Globe size={10} /> Global</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600"><Mail size={14} className="text-slate-400 shrink-0" /><span>{user.email}</span></div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-600"><Globe size={14} className="text-slate-400 shrink-0" /><span>Scope: {user.scope}</span></div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-600"><Clock size={14} className="text-slate-400 shrink-0" /><span>Last login: {user.lastLogin}</span></div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-600"><Calendar size={14} className="text-slate-400 shrink-0" /><span>Member since: {user.joinedDate}</span></div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
                <SecondaryButton onClick={openEditModal} icon={Edit3}>Edit Profile</SecondaryButton>
                <SecondaryButton onClick={openPasswordModal} icon={KeyRound}>Change Password</SecondaryButton>
              </div>
            </div>
          </Card>

          {/* ============================================================
              SECTION 2: APPEARANCE (Theme Selector)
              ============================================================ */}
          <Card className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><Monitor size={16} className="text-slate-500" /></div>
              <div><h3 className="text-sm font-bold text-slate-900">Appearance</h3><p className="text-[11px] text-slate-400">Choose your preferred interface theme. Changes apply to the entire dashboard.</p></div>
            </div>
            <ThemeSelector value={theme} onChange={handleThemeChange} />
            <p className="text-[10px] text-slate-400 mt-3">Preference is saved to your browser and persists across sessions.</p>
          </Card>

          {/* ============================================================
              SECTION 3: SECURITY & SESSIONS (side-by-side)
              ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ---- Security Controls ---- */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><Shield size={16} className="text-slate-500" /></div>
                <div><h3 className="text-sm font-bold text-slate-900">Security</h3><p className="text-[11px] text-slate-400">Password & authentication settings</p></div>
              </div>

              <div className="flex-1 space-y-0">
                {/* Change Password row */}
                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><Lock size={14} className="text-slate-400" /></div>
                    <div><p className="text-xs font-bold text-slate-800">Password</p><p className="text-[10px] text-slate-400 mt-0.5">Update your account password</p></div>
                  </div>
                  <SecondaryButton onClick={openPasswordModal} className="!text-[10px] !px-3.5 !py-2">Change</SecondaryButton>
                </div>
                {/* 2FA row */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><KeyRound size={14} className="text-slate-400" /></div>
                    <div><p className="text-xs font-bold text-slate-800">Two-Factor Authentication</p><p className="text-[10px] text-slate-400 mt-0.5">{twoFactorEnabled ? "Your account is secured with 2FA" : "Recommended for enhanced security"}</p></div>
                  </div>
                  <ToggleSwitch active={twoFactorEnabled} onToggle={handleToggle2FA} label="Toggle 2FA" />
                </div>
              </div>
            </Card>

            {/* ---- Active Sessions ---- */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><Smartphone size={16} className="text-slate-500" /></div>
                  <div><h3 className="text-sm font-bold text-slate-900">Active Sessions</h3><p className="text-[11px] text-slate-400">{sessions.length} device{sessions.length !== 1 ? "s" : ""} connected</p></div>
                </div>
                <SecondaryButton onClick={handleRevokeAllSessions} className="!text-[10px] !px-3.5 !py-2">Revoke All</SecondaryButton>
              </div>
              <div className="space-y-0.5">
                {sessions.map((session) => (<SessionCard key={session.id} session={session} onRevoke={handleRevokeSession} />))}
              </div>
            </Card>
          </div>

          {/* ============================================================
              SECTION 4: LOGOUT
              ============================================================ */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center"><LogOut size={16} className="text-rose-500" /></div>
                <div><h3 className="text-sm font-bold text-slate-900">Log Out</h3><p className="text-[11px] text-slate-400">End your current session and return to the login page.</p></div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-full transition-all"><LogOut size={14} /> Log Out</button>
            </div>
          </Card>
        </div>
      </MainLayout>

      {/* ==================================================================
          MODALS
          ================================================================== */}

      {/* ---- EDIT PROFILE MODAL ---- */}
      <PageModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile" subtitle="Update your personal information" badges={<span className="inline-flex items-center gap-1 whitespace-nowrap text-left text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider"><Shield size={10} /> {user.role}</span>} maxWidth="max-w-lg" footer={<div className="flex justify-end items-center gap-2 w-full"><SecondaryButton onClick={() => setEditModalOpen(false)}>Cancel</SecondaryButton><PrimaryButton onClick={handleSaveProfile} isLoading={isSaving} className="!w-auto !py-2.5 !px-6 !text-xs !rounded-full"><Save size={14} /> Save Changes</PrimaryButton></div>}>
        {/* Avatar section */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="h-16 w-16 rounded-2xl bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 border-2 border-slate-100 overflow-hidden">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : getInitials(editName || user.name)}
            </div>
            <button className="absolute inset-0 rounded-2xl bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleAvatarUpload} aria-label="Upload avatar"><Camera size={20} className="text-white" /></button>
          </div>
          <div><p className="text-sm font-bold text-slate-900">Profile Photo</p><p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or GIF. Max 2MB.</p></div>
        </div>

        {/* Form fields */}
        <InputGroup id="edit-name" label="Full Name *" placeholder="Enter your full name" icon={User} value={editName} onChange={(e) => setEditName(e.target.value)} />
        <InputGroup id="edit-email" label="Email Address *" placeholder="Enter your email" icon={Mail} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />

        {/* Read-only fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 tracking-wide flex items-center gap-1.5"><Shield size={11} /> Role</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-400">{user.role}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 tracking-wide flex items-center gap-1.5"><Globe size={11} /> Scope</label>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 flex items-center gap-1.5"><Globe size={12} /> {user.scope}</div>
          </div>
        </div>
      </PageModal>

      {/* ---- CHANGE PASSWORD MODAL ---- */}
      <PageModal isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} title="Change Password" subtitle="Enter your current password and choose a new one" maxWidth="max-w-md" footer={<div className="flex justify-end items-center gap-2 w-full"><SecondaryButton onClick={() => { setPasswordModalOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</SecondaryButton><PrimaryButton onClick={handleChangePassword} isLoading={isChangingPassword} className="!w-auto !py-2.5 !px-6 !text-xs !rounded-full"><Lock size={14} /> Update Password</PrimaryButton></div>}>
        <InputGroup id="current-pw" label="Current Password *" placeholder="Enter current password" icon={Lock} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} isPassword />
        <InputGroup id="new-pw" label="New Password *" placeholder="Enter new password" icon={KeyRound} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} isPassword />

        {/* Password strength indicator */}
        {newPassword.length > 0 && (
          <div className="-mt-3 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password Strength</span>
              <span className={`text-[10px] font-bold ${passwordStrength.level <= 1 ? "text-rose-600" : passwordStrength.level === 2 ? "text-amber-600" : passwordStrength.level === 3 ? "text-blue-600" : "text-emerald-600"}`}>{passwordStrength.label}</span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= passwordStrength.level ? passwordStrength.color : "bg-slate-100"}`} />
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {[
                { check: newPassword.length >= 8, text: "At least 8 characters" },
                { check: /[A-Z]/.test(newPassword), text: "One uppercase letter" },
                { check: /[0-9]/.test(newPassword), text: "One number" },
                { check: /[^A-Za-z0-9]/.test(newPassword), text: "One special character" },
              ].map((rule, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 text-[10px] font-medium ${rule.check ? "text-emerald-600" : "text-slate-400"}`}>
                  {rule.check ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {rule.text}
                </div>
              ))}
            </div>
          </div>
        )}

        <InputGroup id="confirm-pw" label="Confirm New Password *" placeholder="Confirm new password" icon={KeyRound} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} isPassword />

        {/* Match indicator */}
        {confirmPassword.length > 0 && (
          <div className={`-mt-3 flex items-center gap-1.5 text-[10px] font-bold ${passwordsMatch ? "text-emerald-600" : "text-rose-600"}`}>
            {passwordsMatch ? <><CheckCircle size={10} /> Passwords match</> : <><AlertTriangle size={10} /> Passwords do not match</>}
          </div>
        )}

        {/* Policy notice */}
        <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Shield size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Password Policy</p><p className="text-[10px] text-slate-400 leading-relaxed">Must be at least 8 characters with uppercase, number, and special character. Cannot reuse last 3 passwords.</p></div>
        </div>
      </PageModal>

      {/* ---- CONFIRMATION MODAL ---- */}
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal((p) => ({ ...p, isOpen: false }))} onConfirm={confirmModal.action} title={confirmModal.title} message={confirmModal.message} variant={confirmModal.variant} confirmText={confirmModal.confirmText} />

      {/* ---- TOAST ---- */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

export default ProfilePage;
