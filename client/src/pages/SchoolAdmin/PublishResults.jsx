import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { studentsApi }    from '../../api/students';
import { reportcardsApi } from '../../api/reportcards';
import { feesApi }        from '../../api/fees';
import DataTable   from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button      from '../../components/ui/Button';
import Modal       from '../../components/ui/Modal';
import { Zap, CheckCircle2, Ban, ClipboardList, PartyPopper, AlertTriangle, Check } from 'lucide-react';

const CONFETTI_COLORS = ['#f59e0b', '#3b82f6', '#a78bfa', '#22c55e', '#ef4444'];

export default function PublishResults() {
  const [termId, setTermId]         = useState('');
  const [students, setStudents]     = useState([]);
  const [feeMap, setFeeMap]         = useState({});
  const [rcMap, setRcMap]           = useState({});
  const [loading, setLoading]       = useState(false);
  const [publishing, setPublishing] = useState({});
  const [result, setResult]         = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confetti, setConfetti]     = useState([]);
  const confettiRef = useRef(null);

  async function loadStudents() {
    if (!termId.trim()) { toast.error('Enter a Term ID first'); return; }
    setLoading(true);
    try {
      const res = await studentsApi.list({ pageSize: 100 });
      const list = res.data.students;
      setStudents(list);

      // Fetch fee balances in parallel (best-effort)
      const feeResults = await Promise.allSettled(
        list.map((s) => feesApi.getStudentAccount(s.id))
      );
      const fm = {};
      feeResults.forEach((r, i) => {
        if (r.status === 'fulfilled') fm[list[i].id] = r.value.data.balance;
      });
      setFeeMap(fm);

      // Fetch report card statuses in parallel
      const rcResults = await Promise.allSettled(
        list.map((s) => reportcardsApi.get(s.id, termId))
      );
      const rm = {};
      rcResults.forEach((r, i) => {
        if (r.status === 'fulfilled') rm[list[i].id] = r.value.data.reportCard;
      });
      setRcMap(rm);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }

  async function publishOne(student) {
    setPublishing((p) => ({ ...p, [student.id]: true }));
    try {
      const res = await reportcardsApi.publish(student.id, termId);
      const { status, balance } = res.data;
      setRcMap((prev) => ({ ...prev, [student.id]: res.data.reportCard }));

      if (status === 'RELEASED') {
        toast.success(`${student.fullName}'s report card RELEASED!`);
        triggerConfetti();
        setResult({ type: 'released', student, balance });
      } else {
        toast(`${student.fullName}'s report card WITHHELD — GHS ${balance?.toFixed(2)} outstanding`, {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        });
        setResult({ type: 'withheld', student, balance });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      setPublishing((p) => ({ ...p, [student.id]: false }));
    }
  }

  async function bulkPublish() {
    setConfirmBulk(false);
    const unpublished = students.filter((s) => !rcMap[s.id] || rcMap[s.id]?.status !== 'RELEASED');
    for (const student of unpublished) {
      await publishOne(student);
      await new Promise((r) => setTimeout(r, 300)); // stagger requests
    }
    toast.success('Bulk publish complete!');
  }

  function triggerConfetti() {
    const pieces = Array.from({ length: 15 }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      size: Math.random() * 10 + 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      round: Math.random() > 0.5,
      left: `${40 + Math.random() * 20}%`,
      top: `${40 + Math.random() * 20}%`,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 900);
  }

  const columns = [
    { key: 'fullName', label: 'Student',
      render: (v, row) => (
        <div>
          <div className="font-semibold">{v}</div>
          <div className="text-xs text-slate-400">{row.admissionNumber}</div>
        </div>
      )},
    { key: 'id', label: 'Fee Balance',
      render: (id) => {
        const b = feeMap[id];
        if (b == null) return <span className="text-slate-300">—</span>;
        return (
          <span className={`font-bold text-sm inline-flex items-center gap-1 ${b > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {b > 0 ? `GHS ${b.toFixed(2)} owed` : <><CheckCircle2 className="w-3.5 h-3.5" /> Cleared</>}
          </span>
        );
      }},
    { key: 'id', label: 'Report Card',
      render: (id) => {
        const rc = rcMap[id];
        if (!rc) return <span className="text-slate-300 text-xs">Not published</span>;
        return <StatusBadge status={rc.status} />;
      }},
    { key: 'id', label: '',
      render: (id, row) => {
        const rc = rcMap[id];
        const done = rc?.status === 'RELEASED';
        return (
          <Button
            size="sm"
            variant={done ? 'secondary' : 'primary'}
            loading={!!publishing[id]}
            disabled={done}
            onClick={(e) => { e.stopPropagation(); publishOne(row); }}
          >
            {done ? <><Check className="w-3.5 h-3.5" /> Published</> : <><ClipboardList className="w-3.5 h-3.5" /> Publish</>}
          </Button>
        );
      }},
  ];

  return (
    <div className="space-y-6 relative" ref={confettiRef}>
      {/* Confetti overlay */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {confetti.map((p) => (
            <span
              key={p.id}
              className="confetti-burst absolute"
              style={{
                width: p.size, height: p.size, background: p.color,
                borderRadius: p.round ? '50%' : '2px', left: p.left, top: p.top,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Publish Results</h1>
          <p className="page-subtitle">Release report cards after fee verification</p>
        </div>
        {students.length > 0 && (
          <Button variant="accent" onClick={() => setConfirmBulk(true)}>
            <ClipboardList className="w-4 h-4" /> Publish All
          </Button>
        )}
      </div>

      {/* How it works */}
      <div className="card p-5 bg-gradient-to-r from-brand-50 to-indigo-50 border-brand-200 animate-fade-in">
        <h3 className="font-bold text-brand-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Result-Fee Intercept
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2 p-3 bg-white rounded-xl shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">Balance = 0</div>
              <div className="text-slate-500 text-xs">Report card released. Email + SMS sent to parent.</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-white rounded-xl shadow-sm">
            <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">Balance &gt; 0</div>
              <div className="text-slate-500 text-xs">Report withheld. Payment demand sent to parent.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Term ID input */}
      <div className="card p-5 animate-fade-in-up">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Term ID</label>
            <input className="input" placeholder="Paste Term ID from database…"
                   value={termId} onChange={(e) => setTermId(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadStudents} loading={loading}>Load Students</Button>
        </div>
      </div>

      {/* Results Table */}
      {students.length > 0 && (
        <div className="card p-5 animate-fade-in-up">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-slate-800">
              {students.length} Students · Term {termId.slice(-8)}
            </h2>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {Object.values(rcMap).filter((r) => r?.status === 'RELEASED').length} released
              </span>
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {Object.values(rcMap).filter((r) => r?.status === 'WITHHELD').length} withheld
              </span>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={students}
            loading={loading}
            emptyMessage="No students found"
            total={students.length}
            pageSize={50}
          />
        </div>
      )}

      {/* Result feedback modal */}
      {result && (
        <Modal
          isOpen={!!result}
          onClose={() => setResult(null)}
          title={result.type === 'released'
            ? <span className="inline-flex items-center gap-2"><PartyPopper className="w-5 h-5" /> Report Card Released!</span>
            : <span className="inline-flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Report Card Withheld</span>}
          size="sm"
        >
          {result.type === 'released' ? (
            <div className="text-center space-y-4 py-2">
              <PartyPopper className="w-16 h-16 mx-auto text-brand-600 animate-bounce-soft" />
              <p className="font-semibold text-slate-800 text-lg">{result.student.fullName}</p>
              <p className="text-sm text-slate-600">
                Report card has been <strong className="text-emerald-600">released</strong>.
                Email and SMS notifications have been sent to the parent/guardian.
              </p>
              <Button variant="primary" onClick={() => setResult(null)} className="w-full">Done</Button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-2">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 animate-shake" />
              <p className="font-semibold text-slate-800 text-lg">{result.student.fullName}</p>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-800">
                  Report card <strong>withheld</strong> due to outstanding balance of{' '}
                  <strong className="text-red-600">GHS {result.balance?.toFixed(2)}</strong>.
                </p>
                <p className="text-xs text-red-600 mt-1">A payment demand has been sent to the parent.</p>
              </div>
              <Button variant="secondary" onClick={() => setResult(null)} className="w-full">Close</Button>
            </div>
          )}
        </Modal>
      )}

      {/* Bulk confirm */}
      <Modal isOpen={confirmBulk} onClose={() => setConfirmBulk(false)} title="Publish All Results" size="sm">
        <p className="text-sm text-slate-700 mb-4">
          This will publish results for all <strong>{students.length}</strong> students. 
          Students with outstanding fees will be withheld automatically.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={bulkPublish} className="flex-1">Publish All</Button>
          <Button variant="secondary" onClick={() => setConfirmBulk(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
