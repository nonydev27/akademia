import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { gradesApi } from '../../api/grades';
import { classesApi } from '../../api/classes';
import { termsApi } from '../../api/terms';
import { gradeBandApi } from '../../api/gradeBands';
import Button from '../../components/ui/Button';
import Modal  from '../../components/ui/Modal';
import Input  from '../../components/ui/Input';
import { Check, Plus, Pencil, Trash2 } from 'lucide-react';

function gradeLetter(agg) {
  if (agg == null) return '—';
  if (agg >= 80) return 'A';
  if (agg >= 70) return 'B';
  if (agg >= 60) return 'C';
  if (agg >= 50) return 'D';
  if (agg >= 40) return 'E';
  return 'F';
}

function gradeColor(agg) {
  if (agg == null) return 'text-slate-300';
  if (agg >= 80) return 'score-a';
  if (agg >= 60) return 'score-b';
  if (agg >= 50) return 'score-c';
  return 'score-f';
}

export default function Grades() {
  const [classes,    setClasses]    = useState([]);
  const [terms,      setTerms]      = useState([]);
  const [classId,    setClassId]    = useState('');
  const [termId,     setTermId]     = useState('');
  const [sheet,      setSheet]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [confirmId,  setConfirmId]  = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  // Grade band config (admin-set)
  const [bands, setBands] = useState(null);
  const [showBandForm, setShowBandForm] = useState(false);
  const [bandForm, setBandForm] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, tRes, bRes] = await Promise.all([
          classesApi.list(),
          termsApi.list(),
          gradeBandApi.list(),
        ]);
        setClasses(cRes.data.classes || []);
        setTerms(tRes.data.terms || []);
        setBands(bRes.data.bands || null);
        if (tRes.data.terms?.length && !termId) setTermId(tRes.data.terms[0].id);
      } catch { /* non-fatal */ }
    })();
  }, []); // eslint-disable-line

  async function loadSheet() {
    if (!classId.trim() || !termId.trim()) { toast.error('Select both Class and Term'); return; }
    setLoading(true);
    try {
      const res = await gradesApi.classSheet(classId.trim(), termId.trim());
      setSheet(res.data.sheet);
    } catch { toast.error('Failed to load grade sheet'); }
    finally { setLoading(false); }
  }

  async function handleFinalize(studentId, studentName) {
    setFinalizing(true);
    try {
      const res = await gradesApi.finalize(studentId, termId);
      toast.success(res.data.message);
      setConfirmId(null);
      loadSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    } finally { setFinalizing(false); }
  }

  function effectiveBands() {
    return bands || [
      { letter: 'A', minScore: 80, maxScore: 100, remark: 'Excellent' },
      { letter: 'B', minScore: 70, maxScore: 79.99, remark: 'Very Good' },
      { letter: 'C', minScore: 60, maxScore: 69.99, remark: 'Good' },
      { letter: 'D', minScore: 50, maxScore: 59.99, remark: 'Average' },
      { letter: 'E', minScore: 40, maxScore: 49.99, remark: 'Below Average' },
      { letter: 'F', minScore: 0, maxScore: 39.99, remark: 'Fail' },
    ];
  }

  function bandLetter(agg) {
    const b = effectiveBands().find((b) => agg != null && agg >= b.minScore && agg <= b.maxScore);
    return b?.letter ?? 'F';
  }

  // Grade band management
  function openBandEditor() {
    setBandForm((bands || []).map((b) => ({ ...b })));
    setShowBandForm(true);
  }

  function updateBandForm(idx, field, val) {
    setBandForm((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  }

  function addBand() {
    setBandForm((prev) => [...prev, { letter: '', minScore: 0, maxScore: 0, remark: '' }]);
  }

  function removeBand(idx) {
    setBandForm((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveBands() {
    try {
      await gradeBandApi.set(bandForm);
      toast.success('Grade bands updated');
      setShowBandForm(false);
      const bRes = await gradeBandApi.list();
      setBands(bRes.data.bands);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grade bands');
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade Sheet</h1>
          <p className="page-subtitle">View and manage student grades by class and term</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Class</label>
            <select className="input w-52" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Term</label>
            <select className="input w-52" value={termId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={loadSheet} loading={loading}>Load Sheet</Button>
        </div>
      </div>

      {/* Grade bands */}
      <div className="card p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Grade Scale {bands ? '' : '(default)'}</h2>
          <Button size="sm" variant="outline" onClick={openBandEditor}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(effectiveBands()).map((b) => (
            <span key={b.letter} className="px-3 py-1.5 rounded-xl text-xs font-semibold
              bg-slate-100 text-slate-700">
              {b.letter}: {b.minScore}–{b.maxScore} ({b.remark})
            </span>
          ))}
        </div>
      </div>

      {sheet.length > 0 && (
        <div className="card p-5 animate-fade-in-up overflow-x-auto">
          <h2 className="font-bold text-slate-800 mb-4">{sheet.length} Students</h2>
          <table className="table min-w-max">
            <thead>
              <tr>
                <th>Student</th>
                {sheet[0]?.grades.map((g) => (
                  <th key={g.id}>{g.subject?.name}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((row, i) => (
                <tr key={row.student.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <td>
                    <div className="font-semibold">{row.student.fullName}</div>
                    <div className="text-xs text-slate-400">{row.student.admissionNumber}</div>
                  </td>
                  {row.grades.map((g) => (
                    <td key={g.id}>
                      <div className="text-xs text-slate-500">CA: {g.caScore ?? '—'} | Exam: {g.examScore ?? '—'}</div>
                      <div className={`font-bold text-sm ${gradeColor(g.aggregate)}`}>
                        {g.aggregate ?? '—'} ({bandLetter(g.aggregate)})
                      </div>
                      {g.finalized && (
                        <span className="text-xs text-emerald-500 inline-flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Final
                        </span>
                      )}
                    </td>
                  ))}
                  <td>
                    {row.grades.some((g) => !g.finalized) && (
                      <Button size="sm" variant="outline" onClick={() => setConfirmId(row.student)}>
                        Finalize
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!confirmId} onClose={() => setConfirmId(null)} title="Finalize Grades" size="sm">
        <p className="text-sm text-slate-700 mb-4">
          Finalize grades for <strong>{confirmId?.fullName}</strong>?
          <span className="text-amber-600 font-medium"> Grades cannot be edited after finalization.</span>
        </p>
        <div className="flex gap-3">
          <Button variant="primary" loading={finalizing}
                  onClick={() => handleFinalize(confirmId.id, confirmId.fullName)} className="flex-1">
            Finalize
          </Button>
          <Button variant="secondary" onClick={() => setConfirmId(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Grade Band Editor Modal */}
      <Modal isOpen={showBandForm} onClose={() => setShowBandForm(false)} title="Edit Grade Scale" size="lg">
        <div className="space-y-3">
          {bandForm.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Input label="Letter" value={b.letter} onChange={(e) => updateBandForm(idx, 'letter', e.target.value.toUpperCase())} className="w-16" />
              <Input label="Min" type="number" value={b.minScore} onChange={(e) => updateBandForm(idx, 'minScore', parseFloat(e.target.value) || 0)} className="w-20" />
              <Input label="Max" type="number" value={b.maxScore} onChange={(e) => updateBandForm(idx, 'maxScore', parseFloat(e.target.value) || 0)} className="w-20" />
              <Input label="Remark" value={b.remark} onChange={(e) => updateBandForm(idx, 'remark', e.target.value)} className="flex-1" />
              <Button size="sm" variant="ghost" onClick={() => removeBand(idx)} className="text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={addBand}>
              <Plus className="w-3.5 h-3.5" /> Add Band
            </Button>
            <Button variant="primary" onClick={saveBands} className="flex-1">Save Grade Scale</Button>
            <Button variant="secondary" onClick={() => setShowBandForm(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
