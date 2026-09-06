import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { feesApi }    from '../../api/fees';
import { studentsApi } from '../../api/students';
import DataTable   from '../../components/ui/DataTable';
import Button      from '../../components/ui/Button';
import Input       from '../../components/ui/Input';
import Modal       from '../../components/ui/Modal';
import { Wallet, CreditCard, FileText, Unlock, RefreshCw, CheckCircle2, Check } from 'lucide-react';

const TABS = [
  { label: 'Outstanding',     Icon: Wallet },
  { label: 'Record Payment',  Icon: CreditCard },
  { label: 'Fee Structures',  Icon: FileText },
  { label: 'Override',        Icon: Unlock },
];

export default function Fees() {
  const [tab, setTab]               = useState(0);
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  async function fetchOutstanding() {
    setLoading(true);
    try {
      const res = await feesApi.outstanding();
      setOutstanding(res.data.students);
    } catch { toast.error('Failed to load outstanding fees'); }
    finally { setLoading(false); }
  }

  const totalOwed = outstanding.reduce((s, o) => s + o.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Ledger</h1>
          <p className="page-subtitle">Manage fee structures, payments, and balances</p>
        </div>
        {outstanding.length > 0 && (
          <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm">
            <span className="font-bold text-red-700">{outstanding.length}</span>
            <span className="text-red-600"> student{outstanding.length !== 1 ? 's' : ''} owe </span>
            <span className="font-bold text-red-700">GHS {totalOwed.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t.label} className={`tab-item inline-flex items-center gap-1.5 ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
            <t.Icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 0 && <OutstandingTab data={outstanding} loading={loading} onRefresh={fetchOutstanding} />}
      {tab === 1 && <RecordPaymentTab onDone={fetchOutstanding} />}
      {tab === 2 && <FeeStructuresTab />}
      {tab === 3 && <OverrideTab onDone={fetchOutstanding} />}
    </div>
  );
}

function OutstandingTab({ data, loading, onRefresh }) {
  const cols = [
    { key: 'student', label: 'Student',
      render: (s) => (
        <div>
          <div className="font-semibold">{s.fullName}</div>
          <div className="text-xs text-slate-400">{s.admissionNumber}</div>
        </div>
      )},
    { key: 'balance', label: 'Balance',
      render: (v) => <span className="font-bold text-red-600">GHS {v.toFixed(2)}</span> },
  ];
  return (
    <div className="card p-5 animate-fade-in-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-slate-800">Students with Outstanding Balances</h2>
        <Button size="sm" variant="secondary" onClick={onRefresh}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
      </div>
      <DataTable columns={cols} data={data} loading={loading}
                 emptyMessage="No outstanding balances — all fees cleared!"
                 emptyIcon={<CheckCircle2 className="w-12 h-12" />} total={data.length} pageSize={20} />
    </div>
  );
}

function RecordPaymentTab({ onDone }) {
  const [form, setForm]     = useState({ studentId: '', amount: '', reference: '' });
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function searchStudents() {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await studentsApi.list({ search, pageSize: 5 });
      setStudents(res.data.students);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await feesApi.createPayment({
        studentId: form.studentId,
        amount:    parseFloat(form.amount),
        reference: form.reference,
      });
      toast.success(`Payment of GHS ${form.amount} recorded! Balance: GHS ${res.data.balance.toFixed(2)}`);
      setForm({ studentId: '', amount: '', reference: '' });
      setStudents([]);
      setSearch('');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setSaving(false); }
  }

  const selected = students.find((s) => s.id === form.studentId);

  return (
    <div className="card p-6 max-w-lg animate-fade-in-up">
      <h2 className="font-bold text-slate-800 mb-5">Record Payment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student search */}
        <div>
          <label className="label">Search Student</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Name or admission number…"
                   value={search} onChange={(e) => setSearch(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudents())} />
            <Button type="button" variant="secondary" onClick={searchStudents} loading={searching}>Search</Button>
          </div>
          {students.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
              {students.map((s) => (
                <button key={s.id} type="button"
                        onClick={() => { setForm({ ...form, studentId: s.id }); setStudents([]); setSearch(s.fullName); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors
                                    ${form.studentId === s.id ? 'bg-brand-50 font-semibold text-brand-800' : ''}`}>
                  {s.fullName} <span className="text-slate-400">· {s.admissionNumber}</span>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="mt-2 px-4 py-2 bg-brand-50 rounded-xl text-sm text-brand-800 inline-flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {selected.fullName} selected
            </div>
          )}
        </div>

        <div>
          <label className="label">Amount (GHS)</label>
          <input className="input" type="number" min="0.01" step="0.01" placeholder="0.00"
                 value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>

        <Input label="Payment Reference" placeholder="e.g. MTN-MOMO-123456"
               value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} required />

        <Button type="submit" variant="accent" loading={saving} disabled={!form.studentId} className="w-full">
          <CreditCard className="w-4 h-4" /> Record Payment
        </Button>
      </form>
    </div>
  );
}

function FeeStructuresTab() {
  const [form, setForm] = useState({ termId: '', amount: '', label: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await feesApi.createStructure({ ...form, amount: parseFloat(form.amount) });
      toast.success('Fee structure created');
      setForm({ termId: '', amount: '', label: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create structure');
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-6 max-w-lg animate-fade-in-up">
      <h2 className="font-bold text-slate-800 mb-5">Create Fee Structure</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Fee Label" placeholder="e.g. Term 1 School Fees"
               value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
        <Input label="Amount (GHS)" type="number" min="0.01" step="0.01"
               value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <Input label="Term ID" placeholder="Paste Term ID from database"
               value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })} required />
        <Button type="submit" variant="primary" loading={saving} className="w-full">
          Create Fee Structure
        </Button>
      </form>
    </div>
  );
}

function OverrideTab({ onDone }) {
  const [search, setSearch]   = useState('');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function searchStudents() {
    try {
      const res = await studentsApi.list({ search, pageSize: 5 });
      setStudents(res.data.students);
    } catch { toast.error('Search failed'); }
  }

  async function handleOverride() {
    if (!selected || !reason.trim()) return;
    setSaving(true);
    try {
      await feesApi.override(selected.id, reason);
      toast.success(`Fee lock overridden for ${selected.fullName}`);
      setSelected(null); setReason(''); setConfirm(false); setStudents([]); setSearch('');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="card p-6 max-w-lg animate-fade-in-up">
      <div className="flex items-center gap-3 mb-5">
        <Unlock className="w-6 h-6 text-slate-700" />
        <div>
          <h2 className="font-bold text-slate-800">Fee Lock Override</h2>
          <p className="text-xs text-slate-500">Admin action — every override is audited</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Search student…"
                 value={search} onChange={(e) => setSearch(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchStudents())} />
          <Button type="button" variant="secondary" onClick={searchStudents}>Search</Button>
        </div>

        {students.map((s) => (
          <button key={s.id} type="button"
                  onClick={() => { setSelected(s); setStudents([]); setSearch(s.fullName); }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl border transition-colors
                              ${selected?.id === s.id ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}>
            {s.fullName} · {s.admissionNumber}
          </button>
        ))}

        {selected && (
          <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
            <p className="text-sm font-semibold text-amber-800">
              Override fee lock for <strong>{selected.fullName}</strong>?
            </p>
            <Input label="Reason (required)" placeholder="e.g. Scholarship approved, pending documentation"
                   value={reason} onChange={(e) => setReason(e.target.value)} required />
            <Button variant="danger" onClick={() => setConfirm(true)} disabled={!reason.trim()}>
              Confirm Override
            </Button>
          </div>
        )}
      </div>

      <Modal isOpen={confirm} onClose={() => setConfirm(false)} title="Confirm Fee Override" size="sm">
        <p className="text-sm text-slate-700 mb-4">
          You are about to override the fee lock for <strong>{selected?.fullName}</strong>. 
          This action will be audited. Continue?
        </p>
        <div className="flex gap-3">
          <Button variant="danger" loading={saving} onClick={handleOverride} className="flex-1">Yes, Override</Button>
          <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
