import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { subscriptionsApi } from '../../api/subscriptions';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function PendingSubscriptions() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPending(); }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const res = await subscriptionsApi.pending();
      setPending(res.data.pending || []);
    } catch { toast.error('Failed to load pending subscriptions'); }
    finally { setLoading(false); }
  }

  async function handleConfirm(tenantId, reference) {
    setConfirming((c) => ({ ...c, [tenantId]: true }));
    try {
      await subscriptionsApi.confirm(tenantId, { reference });
      toast.success('Subscription activated');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed');
    } finally { setConfirming((c) => ({ ...c, [tenantId]: false })); }
  }

  const filtered = pending.filter((p) =>
    p.schoolName.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'schoolName', label: 'School',
      render: (v) => <span className="font-semibold text-slate-800">{v}</span> },
    { key: 'plan', label: 'Plan',
      render: (v) => <StatusBadge status={v} /> },
    { key: 'amount', label: 'Amount',
      render: (v) => `GHS ${(v || 0).toLocaleString()}` },
    { key: 'reference', label: 'Reference',
      render: (v) => <span className="font-mono text-xs">{v?.slice(0, 24)}…</span> },
    { key: 'paymentAt', label: 'Payment Date',
      render: (v) => v ? new Date(v).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—' },
    { key: 'id', label: 'Actions',
      render: (id, row) => (
        <Button size="sm" variant="primary" loading={!!confirming[row.tenantId]}
                onClick={() => handleConfirm(row.tenantId, row.reference)}>
          Confirm
        </Button>
      ) },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Subscriptions</h1>
          <p className="page-subtitle">Review and confirm subscription payments</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-800">{pending.length}</div>
          <div className="text-xs text-slate-400 uppercase">Pending</div>
        </div>
        <div className="card p-5 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-800">
            GHS {pending.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 uppercase">Total Awaiting</div>
        </div>
        <div className="card p-5 text-center">
          <RefreshCw className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-800">{pending.filter((p) => p.reference).length}</div>
          <div className="text-xs text-slate-400 uppercase">Awaiting Verify</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Search schools…"
               value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card p-5 animate-fade-in-up">
        <DataTable columns={columns} data={filtered} loading={loading}
                   emptyMessage="No pending subscriptions"
                   emptyIcon={<AlertTriangle className="w-12 h-12" />}
                   total={filtered.length} pageSize={20} />
      </div>
    </div>
  );
}
