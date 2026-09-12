import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { profileApi } from '../../api/profile';
import { supabase }   from '../../lib/supabaseClient';
import { useAuth }    from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';
import { UserCircle, Mail, Phone, KeyRound, Save, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ fullName: '', phone: '' });
  const [saving,   setSaving]   = useState(false);

  const [pwForm,   setPwForm]   = useState({ newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await profileApi.get();
        setProfile(res.data.user);
        setForm({ fullName: res.data.user.fullName || '', phone: res.data.user.phone || '' });
      } catch {
        toast.error('Failed to load profile');
      } finally { setLoading(false); }
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.update(form);
      toast.success('Profile updated');
      refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match'); return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
      if (error) throw new Error(error.message);
      toast.success('Password changed successfully');
      setPwForm({ newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Password change failed');
    } finally { setSavingPw(false); }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-lg">
        {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Update your personal details and password</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800
                        flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {user?.fullName?.[0] || '?'}
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{profile?.fullName}</div>
          <div className="text-sm text-slate-500">{profile?.email}</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {profile?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-brand-600" /> Personal Details
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full Name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <div>
            <label className="label flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </label>
            <input className="input bg-slate-50 cursor-not-allowed" value={profile?.email || ''} disabled
              title="Email cannot be changed here" />
            <p className="text-xs text-slate-400 mt-1">Email is managed by the system administrator.</p>
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
            </label>
            <Input type="tel" placeholder="e.g. 0244123456" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Button type="submit" variant="primary" loading={saving}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </form>
      </div>

      {/* Password change */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-brand-600" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input label="New Password" type="password" placeholder="Min. 8 characters"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            minLength={8} required />
          <Input label="Confirm New Password" type="password" placeholder="Repeat new password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            required />
          <Button type="submit" variant="outline" loading={savingPw}>
            <KeyRound className="w-4 h-4" /> Change Password
          </Button>
        </form>
      </div>
    </div>
  );
}
