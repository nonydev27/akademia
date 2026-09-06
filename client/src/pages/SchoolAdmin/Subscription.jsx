import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { subscriptionsApi } from '../../api/subscriptions';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import Button      from '../../components/ui/Button';
import Input       from '../../components/ui/Input';

export default function Subscription() {
  const { user }          = useAuth();
  const [sub, setSub]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(user?.email || '');
  const [renewing, setRenewing] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await subscriptionsApi.status();
      setSub(res.data);
    } catch { toast.error('Failed to load subscription status'); }
    finally { setLoading(false); }
  }

  async function handleRenew(e) {
    e.preventDefault();
    setRenewing(true);
    try {
      const callbackUrl = `${window.location.origin}/admin/subscription`;
      const res = await subscriptionsApi.renew({ email, callbackUrl });
      toast.success('Redirecting to payment…');
      window.open(res.data.checkoutUrl, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start renewal');
    } finally { setRenewing(false); }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!refInput.trim()) return;
    setVerifying(true);
    try {
      await subscriptionsApi.verify(refInput.trim());
      toast.success('Subscription renewed! ✅');
      setRefInput('');
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setVerifying(false); }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  const isLocked = sub?.status === 'EXPIRED_LOCKED';
  const isGrace  = sub?.status === 'EXPIRED_IN_GRACE';
  const daysLeft = sub?.daysRemaining;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="page-subtitle">Manage your school's annual license</p>
        </div>
      </div>

      {/* Locked overlay */}
      {isLocked && (
        <div className="card p-8 bg-red-50 border-2 border-red-300 text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce-soft">🔒</div>
          <h2 className="text-2xl font-extrabold text-red-800 mb-2">Access Locked</h2>
          <p className="text-red-600 mb-6">
            Your school's subscription has expired and the grace period has ended.
            Renew to restore full access. Your data is safe.
          </p>
          <RenewalForm email={email} setEmail={setEmail} renewing={renewing} handleRenew={handleRenew} />
        </div>
      )}

      {/* Status card */}
      {!isLocked && (
        <div className={`card p-6 animate-fade-in border-2 ${
          isGrace ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{isGrace ? '⚠️' : '✅'}</span>
                <StatusBadge status={sub?.status} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {isGrace ? 'Subscription in Grace Period' : 'Subscription Active'}
              </h2>
              {sub?.expiresAt && (
                <p className="text-sm text-slate-600 mt-1">
                  {daysLeft > 0
                    ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} · ${new Date(sub.expiresAt).toLocaleDateString()}`
                    : `Expired on ${new Date(sub.expiresAt).toLocaleDateString()}`
                  }
                </p>
              )}
              {isGrace && sub?.graceEndsAt && (
                <p className="text-sm font-semibold text-amber-700 mt-1">
                  Grace period ends: {new Date(sub.graceEndsAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Countdown ring */}
            {daysLeft != null && daysLeft > 0 && (
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-extrabold ${isGrace ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {daysLeft}
                </div>
                <div className="text-xs text-slate-500 font-medium">days left</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renewal section */}
      {!isLocked && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 animate-fade-in-up">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              💳 Renew Subscription
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Annual license: <strong>GHS 500</strong> · Payment via Paystack
            </p>
            <RenewalForm email={email} setEmail={setEmail} renewing={renewing} handleRenew={handleRenew} />
          </div>

          <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              🔍 Verify Payment
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              After completing Paystack checkout, paste your reference to activate.
            </p>
            <form onSubmit={handleVerify} className="space-y-3">
              <Input
                label="Payment Reference"
                placeholder="e.g. akademia_xxxxx_xxxxxxxx"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                required
              />
              <Button type="submit" variant="accent" loading={verifying} className="w-full">
                Verify & Activate
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RenewalForm({ email, setEmail, renewing, handleRenew }) {
  return (
    <form onSubmit={handleRenew} className="space-y-3">
      <Input
        label="Billing Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="primary" loading={renewing} className="w-full">
        💳 Pay GHS 500 via Paystack
      </Button>
    </form>
  );
}
