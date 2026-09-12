import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth }           from '../../context/AuthContext';
import { subscriptionsApi }  from '../../api/subscriptions';
import Button from '../../components/ui/Button';
import { KeyRound, CheckCircle2, AlertTriangle, Lock, RefreshCw, CreditCard, Calendar } from 'lucide-react';

const PLAN_AMOUNT = 500; // GHS per year

export default function Subscription() {
  const { user } = useAuth();
  const [sub,       setSub]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  // Check for Paystack callback reference in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (ref) verifyPayment(ref);
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await subscriptionsApi.status();
      setSub(res.data);
    } catch {
      toast.error('Failed to load subscription');
    } finally { setLoading(false); }
  }

  async function handleRenew() {
    if (!user?.email) { toast.error('Email not found'); return; }
    setPaying(true);
    try {
      const callbackUrl = window.location.href.split('?')[0]; // current page without params
      const res = await subscriptionsApi.renew({
        email: user.email,
        callbackUrl,
      });
      // Redirect to Paystack checkout
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initialize payment');
      setPaying(false);
    }
  }

  async function verifyPayment(reference) {
    setVerifying(true);
    try {
      await subscriptionsApi.verify(reference);
      toast.success('Payment verified — subscription renewed!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
    } finally { setVerifying(false); }
  }

  const statusConfig = {
    ACTIVE:           { color: 'emerald', icon: CheckCircle2, label: 'Active' },
    EXPIRED_IN_GRACE: { color: 'amber',   icon: AlertTriangle, label: 'Grace Period' },
    EXPIRED_LOCKED:   { color: 'red',     icon: Lock,          label: 'Locked' },
  };
  const cfg = statusConfig[sub?.status] || statusConfig.ACTIVE;
  const StatusIcon = cfg.icon;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="page-subtitle">Manage your Akademia subscription and billing</p>
        </div>
      </div>

      {/* Verifying payment */}
      {verifying && (
        <div className="card p-5 flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
          <span className="text-sm font-medium text-brand-700">Verifying your payment…</span>
        </div>
      )}

      {/* Status card */}
      {loading ? (
        <div className="card p-6 animate-pulse">
          <div className="skeleton h-20 rounded-xl" />
        </div>
      ) : sub && (
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-${cfg.color}-100 flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-7 h-7 text-${cfg.color}-600`} />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">
                  Subscription{' '}
                  <span className={`text-${cfg.color}-600`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Expires {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className={`font-semibold ${sub.daysRemaining <= 0 ? 'text-red-600' : sub.daysRemaining <= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {sub.daysRemaining > 0 ? `${sub.daysRemaining} days remaining` : 'Expired'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {sub.status === 'EXPIRED_IN_GRACE' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Your subscription has expired. You are in the grace period. Renew soon to avoid being locked out.</span>
            </div>
          )}

          {sub.status === 'EXPIRED_LOCKED' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Access is locked. Renew your subscription below to restore access.</span>
            </div>
          )}
        </div>
      )}

      {/* Plan details */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-600" /> Annual Plan
        </h2>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold text-slate-900">GHS {PLAN_AMOUNT}</span>
          <span className="text-slate-500">/ year</span>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 mb-6">
          {[
            'Unlimited students and teachers',
            'Grade entry with subject PIN security',
            'Attendance tracking per subject',
            'Automated report card generation',
            'Fee management and reminders',
            'Communication via email and SMS',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <Button variant="primary" loading={paying} onClick={handleRenew} className="w-full">
          <CreditCard className="w-4 h-4" />
          {sub?.status === 'ACTIVE' ? 'Renew / Extend Subscription' : 'Pay Now — GHS 500'}
        </Button>
        <p className="text-xs text-slate-400 text-center mt-3">
          Secure payment via Paystack. You will be redirected to complete payment.
        </p>
      </div>

      {/* Last payment */}
      {sub?.lastPaymentRef && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Last Payment</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Reference</div>
              <code className="text-xs font-mono text-slate-700 break-all">{sub.lastPaymentRef}</code>
            </div>
            {sub.lastPaymentAt && (
              <div>
                <div className="text-slate-500">Date</div>
                <div className="font-semibold text-slate-700">
                  {new Date(sub.lastPaymentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )}
            {sub.lastPaymentAmt && (
              <div>
                <div className="text-slate-500">Amount</div>
                <div className="font-semibold text-emerald-700">GHS {sub.lastPaymentAmt.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
