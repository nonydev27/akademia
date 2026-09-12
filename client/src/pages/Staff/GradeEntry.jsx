import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { gradesApi }   from '../../api/grades';
import { subjectsApi } from '../../api/subjects';
import { staffApi }    from '../../api/staff';
import { termsApi }    from '../../api/terms';
import Button  from '../../components/ui/Button';
import Modal   from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import { Save, Lock, AlertTriangle, KeyRound, BookOpen, CheckCircle2 } from 'lucide-react';

function computeAggregate(ca, midterm, exam) {
  const c = parseFloat(ca), m = parseFloat(midterm), e = parseFloat(exam);
  let total = 0, weight = 0;
  if (!isNaN(c)) { total += c * 0.30; weight += 0.30; }
  if (!isNaN(m)) { total += m * 0.20; weight += 0.20; }
  if (!isNaN(e)) { total += e * 0.50; weight += 0.50; }
  if (weight === 0) return null;
  return Math.round((total / weight) * 100) / 100;
}

const GRADE_BANDS = [
  { min: 80, letter: 'A', cls: 'score-a' },
  { min: 70, letter: 'B', cls: 'score-b' },
  { min: 60, letter: 'C', cls: 'score-c' },
  { min: 50, letter: 'D', cls: 'score-d' },
  { min: 40, letter: 'E', cls: 'score-e' },
];
function gradeInfo(agg) {
  if (agg == null) return { letter: '—', cls: 'text-slate-300' };
  return GRADE_BANDS.find((b) => agg >= b.min) ?? { letter: 'F', cls: 'score-f' };
}

export default function GradeEntry() {
  // PIN verification state
  const [subjectCode, setSubjectCode] = useState('');
  const [pin,         setPin]         = useState('');
  const [verifying,   setVerifying]   = useState(false);
  const [verified,    setVerified]    = useState(null); // { id, name, code }

  // Sheet state
  const [myAssignments, setMyAssignments] = useState([]); // [{ class, subject, accessCode }]
  const [terms,     setTerms]     = useState([]);          // labelled term options
  const [classId,   setClassId]   = useState('');
  const [termId,    setTermId]    = useState('');
  const [sheet,     setSheet]     = useState([]);
  const [scores,    setScores]    = useState({});
  const [meta,      setMeta]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [finalizeModal, setFinalizeModal] = useState(false);
  const [finalizing,    setFinalizing]    = useState(false);

  // Load the teacher's own assignments so classes can be chosen from a list
  // (code-based) instead of pasted as UUIDs.
  const loadMyAssignments = useCallback(async () => {
    try {
      const res = await staffApi.mine();
      setMyAssignments(res.data.assignments || []);
    } catch { /* non-fatal: dropdown simply stays empty */ }
  }, []);

  useEffect(() => { loadMyAssignments(); }, [loadMyAssignments]);

  // Load labelled terms so the teacher picks one instead of pasting a UUID.
  useEffect(() => {
    (async () => {
      try {
        const res = await termsApi.list();
        setTerms(res.data.terms || []);
        if (res.data.terms?.length && !termId) setTermId(res.data.terms[0].id);
      } catch { /* non-fatal */ }
    })();
  }, []); // eslint-disable-line

  // Classes the teacher can enter grades for, deduped.
  const myClasses = Array.from(
    new Map(myAssignments.map((a) => [a.class.id, a.class])).values()
  );

  async function handleVerifyPin(e) {
    e.preventDefault();
    if (!subjectCode.trim()) { toast.error('Enter a subject code'); return; }
    if (!/^\d{4}$/.test(pin)) { toast.error('PIN must be 4 digits'); return; }
    setVerifying(true);
    try {
      // First find subject by code — list subjects filtered by tenant happens server-side
      // We verify the pin directly using the subjects API
      // The server will look up the subject by ID, so we first need to find it.
      // We'll post to verify-pin by code by calling a list first or use a code-based endpoint.
      // Since server uses subject ID, we search subjects list (admin sees all but staff sees assigned)
      // For staff we verify by subjectCode: we call verifyPin with the code as the id query param
      // The server subject routes use /:id — so we need the subject's UUID.
      // We'll do a two-step: look up the subject code first via a dedicated param.
      const res = await subjectsApi.verifyByCode(subjectCode.trim().toUpperCase(), pin);
      setVerified(res.data.subject);
      toast.success(`Verified — ${res.data.subject.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'PIN verification failed');
    } finally { setVerifying(false); }
  }

  async function loadSheet() {
    if (!classId.trim() || !termId.trim()) {
      toast.error('Enter Class ID and Term ID'); return;
    }
    setLoading(true);
    try {
      const res = await gradesApi.sheetLoad(classId.trim(), verified.id, termId.trim());
      const { sheet: rows, meta: m } = res.data;
      setSheet(rows);
      setMeta(m);
      const initial = {};
      rows.forEach((r) => {
        initial[r.studentId] = {
          ca:      r.caScore      != null ? String(r.caScore)      : '',
          midterm: r.midtermScore != null ? String(r.midtermScore) : '',
          exam:    r.examScore    != null ? String(r.examScore)    : '',
          remarks: r.remarks ?? '',
        };
      });
      setScores(initial);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load grade sheet');
    } finally { setLoading(false); }
  }

  function setScore(sid, field, val) {
    setScores((prev) => ({ ...prev, [sid]: { ...prev[sid], [field]: val } }));
  }

  async function saveAll() {
    if (!sheet.length) return;
    setSaving(true);
    try {
      const rows = sheet.filter((r) => !r.finalized).map((r) => {
        const s = scores[r.studentId] || {};
        const p = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
        return { studentId: r.studentId, caScore: p(s.ca), midtermScore: p(s.midterm), examScore: p(s.exam), remarks: s.remarks || '' };
      });
      if (!rows.length) { toast('All grades already finalized'); return; }
      await gradesApi.sheetSave({ classId: classId.trim(), subjectId: verified.id, termId: termId.trim(), rows });
      toast.success(`${rows.length} row${rows.length !== 1 ? 's' : ''} saved`);
      await loadSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      const res = await gradesApi.sheetFinalize(classId.trim(), verified.id, termId.trim());
      toast.success(res.data.message);
      setFinalizeModal(false);
      await loadSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    } finally { setFinalizing(false); }
  }

  const hasUnfinalized = sheet.some((r) => !r.finalized);

  // Step 1: PIN verification
  if (!verified) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Subject Verification</h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter your subject code and 4-digit PIN to access grade entry.
            This ensures only you can edit grades for your subject.
          </p>
          <form onSubmit={handleVerifyPin} className="space-y-4 text-left">
            <div>
              <label className="label">Subject Code</label>
              <input className="input uppercase" placeholder="e.g. ENGL01"
                value={subjectCode} onChange={(e) => setSubjectCode(e.target.value.toUpperCase())} required />
            </div>
            <div>
              <label className="label">4-Digit PIN</label>
              <input type="password" inputMode="numeric" maxLength={4}
                className="input text-center text-2xl font-mono tracking-widest"
                placeholder="••••"
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
            </div>
            <Button type="submit" variant="primary" loading={verifying} className="w-full">
              <CheckCircle2 className="w-4 h-4" /> Verify &amp; Enter
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-4">
            Forgot your PIN?{' '}
            <Link to="/staff/subjects" className="text-brand-600 hover:text-brand-800 font-semibold underline">
              Reset it in My Subjects
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Grade sheet
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade Entry</h1>
          <div className="flex items-center gap-2 mt-1">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-brand-700">{verified.name}</span>
            <code className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-mono">{verified.code}</code>
            <button onClick={() => { setVerified(null); setPin(''); setSheet([]); }}
              className="text-xs text-slate-400 hover:text-red-500 ml-2 underline">
              Switch subject
            </button>
          </div>
        </div>
        {sheet.length > 0 && hasUnfinalized && (
          <div className="flex gap-2">
            <Button variant="accent" onClick={saveAll} loading={saving}>
              <Save className="w-4 h-4" /> Save All
            </Button>
            <Button variant="outline" onClick={() => setFinalizeModal(true)}>
              <Lock className="w-4 h-4" /> Finalize Sheet
            </Button>
          </div>
        )}
      </div>

      {/* Load controls */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select your class…</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Term</label>
            <select className="input" value={termId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={loadSheet} loading={loading}>Load Sheet</Button>
        </div>
      </div>

      {/* Grade bands legend */}
      {sheet.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[['CA Score','30%','bg-brand-500'],['Midterm','20%','bg-indigo-500'],['Exam','50%','bg-accent-500']].map(([l,p,c]) => (
            <div key={l} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${c}`} />
              <span className="text-slate-600">{l}</span>
              <span className="font-bold text-slate-800">{p}</span>
            </div>
          ))}
          {meta && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs ml-auto">
              <span className="text-slate-400">Class:</span>
              <span className="font-semibold">{meta.class?.name}</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold">{meta.studentCount} students</span>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {sheet.length > 0 && (
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="table min-w-max w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>CA (30%)</th><th>Midterm (20%)</th><th>Exam (50%)</th>
                  <th>Aggregate</th><th>Grade</th><th>Remarks</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sheet.map((row, idx) => {
                  const s = scores[row.studentId] || {};
                  const agg = computeAggregate(s.ca, s.midterm, s.exam);
                  const { letter, cls } = gradeInfo(agg);
                  const locked = row.finalized;
                  return (
                    <tr key={row.studentId} className={locked ? 'opacity-60 bg-slate-50' : ''} style={{ animationDelay: `${idx * 30}ms` }}>
                      <td>
                        <div className="font-semibold text-slate-800">{row.fullName}</div>
                        <div className="text-xs text-slate-400">{row.admissionNumber}</div>
                      </td>
                      {['ca','midterm','exam'].map((f) => (
                        <td key={f}>
                          <input type="number" min="0" max="100" step="0.5"
                            className="input w-20 text-center" placeholder="—"
                            disabled={locked} value={s[f] ?? ''}
                            onChange={(e) => setScore(row.studentId, f, e.target.value)} />
                        </td>
                      ))}
                      <td>
                        <span className={`font-bold text-base ${agg != null ? (agg >= 60 ? 'text-emerald-600' : agg >= 40 ? 'text-amber-500' : 'text-red-500') : 'text-slate-300'}`}>
                          {agg != null ? agg.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td><span className={`font-extrabold text-lg ${cls}`}>{letter}</span></td>
                      <td>
                        <input type="text" maxLength={100} className="input w-32 text-sm"
                          placeholder="Optional…" disabled={locked} value={s.remarks ?? ''}
                          onChange={(e) => setScore(row.studentId, 'remarks', e.target.value)} />
                      </td>
                      <td className="text-center">
                        {locked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">Draft</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finalize Modal */}
      <Modal isOpen={finalizeModal} onClose={() => setFinalizeModal(false)} title="Finalize Grade Sheet" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            You are about to finalize all grades for <strong>{meta?.class?.name}</strong> — <strong>{verified.name}</strong>.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>This cannot be undone.</strong> All grades will be permanently locked.</span>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" loading={finalizing} onClick={handleFinalize}
              className="flex-1 bg-red-600 hover:bg-red-700">
              <Lock className="w-4 h-4" /> Yes, Finalize
            </Button>
            <Button variant="secondary" onClick={() => setFinalizeModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
