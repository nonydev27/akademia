import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { passwordResetApi } from '../../api/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [validToken, setValidToken] = useState(true);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await passwordResetApi.resetPassword({ token, newPassword });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
      if (err.response?.status === 400) setValidToken(false);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Invalid link</h2>
            <p className="text-slate-500 text-sm mt-2">This reset link is missing or expired. Request a new one.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/forgot-password')} className="w-full">
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Link expired</h2>
            <p className="text-slate-500 text-sm mt-2">This reset link is no longer valid. Request a new one.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/forgot-password')} className="w-full">
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Set new password</h2>
          <p className="text-slate-500 text-sm mt-1">Choose a strong password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-10"
                type={showPass ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-10"
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Reset Password
          </Button>
        </form>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
