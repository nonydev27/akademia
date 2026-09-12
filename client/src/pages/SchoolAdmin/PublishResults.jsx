import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { reportcardsApi } from '../../api/reportcards';
import { termsApi }      from '../../api/terms';
import Button from '../../components/ui/Button';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT:     { label: 'Draft',     color: 'bg-slate-100 text-slate-500' },
  SUBMITTED: { label: 'Submitted', color: 'bg-amber-100 text-amber-700' },
  APPROVED:  { label: 'Approved',  color: 'bg-brand-100 text-brand-700' },
  RELEASED:  { label: 'Released',  color: 'bg-emerald-100 text-emerald-700' },
  WITHHELD:  { label: 'Withheld',  color: 'bg-red-100 text-red-600' },
};

export default function PublishResults() {
  const [terms,       setTerms]       = useState([]);
  const [termId,      setTermId]      = useState('');
  const [status,      setStatus]      = useState('SUBMITTED');
  const [cards,       setCards]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [approving,   setApproving]   = useState(null);
  const [rejecting,   setRejecting]   = useState(null);

  // Labelled terms for the dropdown (replaces pasting a Term UUID).
  useEffect(() => {
    (async () => {
      try {
        const res = await termsApi.list();
        setTerms(res.data.terms || []);
        if (res.data.terms?.length && !termId) setTermId(res.data.terms[0].id);
      } catch { /* non-fatal */ }
    })();
  }, []); // eslint-disable-line
  async function loadCards() {
    if (!termId.trim()) { toast.error('Enter a Term ID'); return; }
    setLoading(true);
    setSearched(false);
    try {
      const res = await reportcardsApi.list(termId.trim(), status || undefined);
      setCards(res.data.reportCards);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report cards');
    } finally { setLoading(false); }
  }

  async function handleApprove(card) {
    setApproving(card.student.id);
    try {
      const res = await reportcardsApi.approve(card.student.id, termId.trim());
      toast.success(`${card.student.fullName}: ${res.data.status === 'RELEASED' ? 'Released' : 'Withheld (outstanding fees)'}`);
      loadCards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally { setApproving(null); }
  }

  async function handleReject(card) {
    setRejecting(card.student.id);
    try {
      await reportcardsApi.reject(card.student.id, termId.trim());
      toast.success(`Returned to teacher for revision`);
      loadCards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally { setRejecting(null); }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Publish Results</h1>
          <p className="page-subtitle">Review teacher submissions and approve or reject report cards</p>
        </div>
      </div>

      {/* Workflow explainer */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Clock, color: 'amber', title: '1. Teacher Submits', desc: 'After entering grades, the teacher submits for review.' },
          { icon: ClipboardCheck, color: 'brand', title: '2. Admin Reviews', desc: 'You approve or return to the teacher for corrections.' },
          { icon: CheckCircle2, color: 'emerald', title: '3. Released / Withheld', desc: 'Approved cards are released (or withheld if fees outstanding).' },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className={`p-4 rounded-2xl border bg-${color}-50 border-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600 mb-2`} />
            <div className={`font-semibold text-${color}-800 text-sm`}>{title}</div>
            <p className={`text-xs text-${color}-700 mt-1`}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Term</label>
            <select className="input" value={termId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status Filter</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted (pending review)</option>
              <option value="APPROVED">Approved</option>
              <option value="RELEASED">Released</option>
              <option value="WITHHELD">Withheld</option>
            </select>
          </div>
          <Button variant="primary" onClick={loadCards} loading={loading}>
            <Search className="w-4 h-4" /> Load Results
          </Button>
        </div>
      </div>

      {/* Results table */}
      {searched && (
        <div className="card overflow-hidden animate-fade-in-up">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-slate-400">
              <ClipboardCheck className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No report cards match this filter</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, i) => {
                  const cfg = STATUS_CONFIG[card.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr key={card.id} style={{ animationDelay: `${i * 40}ms` }}>
                      <td>
                        <div className="font-semibold text-slate-800">{card.student.fullName}</div>
                        <div className="text-xs text-slate-400">{card.student.admissionNumber}</div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">
                        {card.submittedAt ? new Date(card.submittedAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="text-right">
                        {card.status === 'SUBMITTED' && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="primary"
                              loading={approving === card.student.id}
                              onClick={() => handleApprove(card)}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline"
                              loading={rejecting === card.student.id}
                              onClick={() => handleReject(card)}
                              className="text-red-600 border-red-200 hover:bg-red-50">
                              <XCircle className="w-3.5 h-3.5" /> Return
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
