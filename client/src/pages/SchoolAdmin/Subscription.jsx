import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth }           from '../../context/AuthContext';
import { subscriptionsApi }  from '../../api/subscriptions';
import Button from '../../components/ui/Button';
import PlanPicker from '../../components/ui/PlanPicker';
import { planById } from '../../config/plans';
import { KeyRound, CheckCircle2, AlertTriangle, Lock, RefreshCw, CreditCard, Calendar } from 'lucide-react';

export default function Subscription() {
  const { user } = useAuth();
  const [sub,       setSub]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [paying,    setPaying]    = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('BASIC');

  useEffect(() => { fetchStatus(); }, []);

  // Check for payment callback reference in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    const plan = params.get('plan') || undefined;
    if (ref) verifyPayment(ref, plan);
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await subscriptionsApi.status();
      setSub(res.data);
      if (res.data.plan) setSelectedPlan(res.data.plan);
    } catch {
      toast.error('Failed to load subscription');
    } finally { setLoading(false); }
  }

  async function handleRenew() {
    if (!user?.email) { toast.error('Email not found'); return; }
    setPaying(true);
    try {
      const callbackUrl = window.location.href.split('?')[0];
      const res = await subscriptionsApi.renew({
        email: user.email,
        callbackUrl,
        plan: selectedPlan,
      });
      const url = res.data.checkoutUrl || '';
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initialize payment');
      setPaying(false);
    }
  }

  if (sub?.status === 'PENDING') {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Subscription</h1>
            <p className="page-subtitle">Payment pending confirmation</p>
          </div>
        </div>
        <div className="card p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Payment Received</h2>
          <p className="text-slate-500 mb-2">
            Your payment for the <strong>{planById(sub?.plan).name}</strong> plan
            {' '}(GHS {planById(sub?.plan).priceGHS.toLocaleString()}/year) has been received.
          </p>
          <p className="text-sm text-amber-600 mb-4">
            A Super Admin will review and confirm your subscription within 24 hours.
          </p>
          <p className="text-xs text-slate-400">
            Reference: <code className="font-mono">{sub?.lastPaymentRef}</code>
          </p>
        </div>
      </div>
    );
  }

  async function verifyPayment(reference, plan) {
    setVerifying(true);
    try {
      await subscriptionsApi.verify(reference, plan);
      toast.success('Payment verified — subscription updated!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
    } finally { setVerifying(false); setPaying(false); }
  }

  const statusConfig = {
    ACTIVE:           { color: 'emerald', icon: CheckCircle2, label: 'Active' },
    PENDING:          { color: 'amber',   icon: AlertTriangle, label: 'Pending' },
    EXPIRED_IN_GRACE: { color: 'amber',   icon: AlertTriangle, label: 'Grace Period' },
    EXPIRED_LOCKED:   { color: 'red',     icon: Lock,          label: 'Locked' },
  };
  const cfg = statusConfig[sub?.status] || statusConfig.ACTIVE;
  const StatusIcon = cfg.icon;
  const activePlan = planById(sub?.plan || 'BASIC');

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
                  {activePlan.name} Plan{' '}
                  <span className={`text-${cfg.color}-600`}>· {cfg.label}</span>
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

      {/* Plan selection + payment */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-600" /> Choose your plan
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Select the plan that fits your school. Billing is per year.
        </p>

        <PlanPicker value={selectedPlan} onChange={setSelectedPlan} />

        <div className="flex items-baseline gap-2 mt-5 mb-4">
          <span className="text-3xl font-extrabold text-slate-900">
            GHS {planById(selectedPlan).priceGHS.toLocaleString()}
          </span>
          <span className="text-slate-500">/ year</span>
        </div>

        <Button variant="primary" loading={paying} onClick={handleRenew} className="w-full">
          <CreditCard className="w-4 h-4" />
          {sub?.status === 'ACTIVE'
            ? `Renew / Switch to ${planById(selectedPlan).name}`
            : `Pay Now — GHS ${planById(selectedPlan).priceGHS.toLocaleString()}`}
        </Button>
        <p className="text-xs text-slate-400 text-center mt-3">
          Secure payment via Paystack / Flutterwave. You'll be redirected to complete payment.
        </p>
      </div>

      {/* What's included */}
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-4">What's included in {activePlan.name}</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {Object.entries(activePlan.features).map(([key, on]) => (
            <div key={key} className={`flex items-center gap-2 text-sm ${on ? 'text-slate-700' : 'text-slate-400'}`}>
              {on
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <Lock className="w-4 h-4 flex-shrink-0" />}
              {key}
            </div>
          ))}
        </div>
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
