import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import { passwordResetApi } from '../../api/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await passwordResetApi.forgotPassword({ email });
      setSent(true);
      toast.success('Check your email for the reset link');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Check your inbox</h2>
            <p className="text-slate-500 text-sm mt-2">
              We sent a password reset link to <strong className="text-slate-700">{email}</strong>
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/login')} className="w-full">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">Forgot password?</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your email and we'll send a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-10"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Send Reset Link
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
