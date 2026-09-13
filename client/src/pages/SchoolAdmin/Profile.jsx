import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { profileApi } from '../../api/profile';
import { supabase }   from '../../lib/supabaseClient';
import { useAuth }    from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';
import { UserCircle, Mail, Phone, KeyRound, Save, ShieldCheck, Camera, X, Link as LinkIcon } from 'lucide-react';

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ fullName: '', phone: '', image: '' });
  const [saving,   setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const fileRef    = useRef(null);

  const [pwForm,   setPwForm]   = useState({ newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await profileApi.get();
        const u = res.data.user;
        setProfile(u);
        setForm({ fullName: u.fullName || '', phone: u.phone || '', image: u.image || '' });
        setImageUrl(u.image?.startsWith('http') ? u.image : '');
        if (u.image) setPreview(u.image);
      } catch {
        toast.error('Failed to load profile');
      } finally { setLoading(false); }
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.update({ fullName: form.fullName, phone: form.phone, image: form.image || undefined });
      toast.success('Profile updated');
      refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        try {
          const { data } = await profileApi.uploadAvatar(base64);
          setForm((f) => ({ ...f, image: data.image }));
          setPreview(data.image);
          toast.success('Profile picture updated');
          refreshProfile();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Upload failed');
        } finally { setUploading(false); }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Upload failed');
      setUploading(false);
    }
  }

  function handleRemoveImage() {
    setForm((f) => ({ ...f, image: '' }));
    setPreview(null);
    setImageUrl('');
    handleSave({ preventDefault: () => {} });
  }

  // Apply a picture provided as a link (http(s) URL) — no upload needed.
  function applyImageUrl() {
    const url = imageUrl.trim();
    if (!url) { toast.error('Paste an image link first'); return; }
    if (!/^https?:\/\//i.test(url)) { toast.error('Link must start with http:// or https://'); return; }
    setForm((f) => ({ ...f, image: url }));
    setPreview(url);
    toast.success('Picture link applied — remember to Save Changes');
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
        <div className="relative flex-shrink-0">
          {preview ? (
            <img src={preview} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-200" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800
                            flex items-center justify-center text-white text-3xl font-bold">
              {user?.fullName?.[0] || '?'}
            </div>
          )}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700
                       flex items-center justify-center text-white shadow-md transition-colors"
            title="Change profile picture">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden" onChange={handleFile} />
        </div>
        <div className="flex items-center gap-3">
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
          {preview && (
            <button type="button" onClick={handleRemoveImage}
              className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
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
          <div>
            <label className="label flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" /> Profile Picture Link
            </label>
            <div className="flex gap-2">
              <input className="input" type="url" placeholder="https://example.com/photo.jpg"
                value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <Button type="button" variant="outline" onClick={applyImageUrl}>Use link</Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Paste a direct image URL, or click the camera icon above to upload from your device.
            </p>
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
