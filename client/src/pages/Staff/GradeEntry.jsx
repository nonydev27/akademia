import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { gradesApi }   from '../../api/grades';
import Button  from '../../components/ui/Button';
import Modal   from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import { Save, Lock, AlertTriangle, Calculator, BookOpen, Hash } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeAggregate(ca, midterm, exam) {
  const c = parseFloat(ca);
  const m = parseFloat(midterm);
  const e = parseFloat(exam);
  // Use proportional weighting if some scores are missing
  let total = 0; let weight = 0;
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
  const band = GRADE_BANDS.find((b) => agg >= b.min);
  return band ?? { letter: 'F', cls: 'score-f' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GradeEntry() {
  const [classId,   setClassId]   = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId,    setTermId]    = useState('');
  const [sheet,     setSheet]     = useState([]);   // rows from API
  const [scores,    setScores]    = useState({});   // { studentId: { ca, midterm, exam, remarks } }
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [finalizeModal, setFinalizeModal] = useState(null);
  const [finalizing,    setFinalizing]    = useState(false);
  const [meta, setMeta] = useState(null);

  async function loadSheet() {
    if (!classId.trim() || !subjectId.trim() || !termId.trim()) {
      toast.error('Please enter Class ID, Subject ID, and Term ID');
      return;
    }
    setLoading(true);
    try {
      const res = await gradesApi.sheetLoad(classId.trim(), subjectId.trim(), termId.trim());
      const { sheet: rows, meta: m } = res.data;
      setSheet(rows);
      setMeta(m);
      // Pre-fill scores from existing grades
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
    } finally {
      setLoading(false);
    }
  }

  function setScore(sid, field, val) {
    setScores((prev) => ({ ...prev, [sid]: { ...prev[sid], [field]: val } }));
  }

  async function saveAll() {
    if (!sheet.length) return;
    setSaving(true);
    try {
      const rows = sheet
        .filter((r) => !r.finalized)
        .map((r) => {
          const s = scores[r.studentId] || {};
          const parseScore = (v) => {
            const n = parseFloat(v);
            return isNaN(n) ? null : n;
          };
          return {
            studentId:    r.studentId,
            caScore:      parseScore(s.ca),
            midtermScore: parseScore(s.midterm),
            examScore:    parseScore(s.exam),
            remarks:      s.remarks || '',
          };
        });

      if (!rows.length) {
        toast('All grades are already finalized — nothing to save.', { icon: '🔒' });
        return;
      }

      await gradesApi.sheetSave({
        classId:   classId.trim(),
        subjectId: subjectId.trim(),
        termId:    termId.trim(),
        rows,
      });
      toast.success(`${rows.length} row${rows.length !== 1 ? 's' : ''} saved`);
      // Reload to get fresh aggregates from the server
      await loadSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!classId || !subjectId || !termId) return;
    setFinalizing(true);
    try {
      const res = await gradesApi.sheetFinalize(classId.trim(), subjectId.trim(), termId.trim());
      toast.success(res.data.message);
      setFinalizeModal(null);
      await loadSheet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    } finally {
      setFinalizing(false);
    }
  }

  const hasUnfinalized = sheet.some((r) => !r.finalized);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade Entry</h1>
          <p className="page-subtitle">
            Enter CA, Midterm and Exam scores · Formula: CA 30% + Midterm 20% + Exam 50%
          </p>
        </div>
        {sheet.length > 0 && hasUnfinalized && (
          <div className="flex gap-2">
            <Button variant="accent" onClick={saveAll} loading={saving}>
              <Save className="w-4 h-4" /> Save All
            </Button>
            <Tooltip
              tip="Finalize locks every grade in this sheet permanently. Only do this when all scores are correct."
              position="left"
            >
              <Button variant="outline" onClick={() => setFinalizeModal(true)}>
                <Lock className="w-4 h-4" /> Finalize Sheet
              </Button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Filter controls */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Class ID
              <Tooltip tip="The UUID of the class. Find it in Prisma Studio under the Class table." />
            </label>
            <input
              className="input"
              placeholder="Paste Class ID…"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Subject ID
              <Tooltip tip="The UUID of the subject (e.g. Mathematics). Find it in the Subject table." />
            </label>
            <input
              className="input"
              placeholder="Paste Subject ID…"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-400" />
              Term ID
              <Tooltip tip="The UUID of the academic term (e.g. Term 1). Find it in the Term table." />
            </label>
            <input
              className="input"
              placeholder="Paste Term ID…"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={loadSheet} loading={loading}>
            Load Sheet
          </Button>
        </div>
      </div>

      {/* Grade formula reminder */}
      {sheet.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'CA Score',        pct: '30%', color: 'bg-brand-500' },
            { label: 'Midterm Score',   pct: '20%', color: 'bg-indigo-500' },
            { label: 'End-Term Exam',   pct: '50%', color: 'bg-accent-500' },
          ].map((b) => (
            <div key={b.label}
                 className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
              <span className="text-slate-600">{b.label}</span>
              <span className="font-bold text-slate-800">{b.pct}</span>
            </div>
          ))}
          {meta && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs ml-auto">
              <span className="text-slate-400">Class:</span>
              <span className="font-semibold text-slate-800">{meta.class?.name}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">Subject:</span>
              <span className="font-semibold text-slate-800">{meta.subject?.name}</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-800">{meta.studentCount} students</span>
            </div>
          )}
        </div>
      )}

      {/* Grade entry table */}
      {sheet.length > 0 && (
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="table min-w-max w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>
                    <span className="flex items-center gap-1">
                      CA Score
                      <Tooltip tip="Continuous Assessment: class tests, quizzes, homework. Worth 30% of the aggregate." />
                    </span>
                  </th>
                  <th>
                    <span className="flex items-center gap-1">
                      Midterm
                      <Tooltip tip="Mid-term examination score. Worth 20% of the aggregate." />
                    </span>
                  </th>
                  <th>
                    <span className="flex items-center gap-1">
                      Exam
                      <Tooltip tip="End-of-term examination score. Worth 50% of the aggregate." />
                    </span>
                  </th>
                  <th>
                    <span className="flex items-center gap-1">
                      Aggregate
                      <Tooltip tip="Weighted total: (CA×30%) + (Midterm×20%) + (Exam×50%). Shown proportionally until all scores are entered." />
                    </span>
                  </th>
                  <th>Grade</th>
                  <th>Remarks</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sheet.map((row, idx) => {
                  const s       = scores[row.studentId] || {};
                  const agg     = computeAggregate(s.ca, s.midterm, s.exam);
                  const { letter, cls } = gradeInfo(agg);
                  const locked  = row.finalized;

                  return (
                    <tr
                      key={row.studentId}
                      className={locked ? 'opacity-60 bg-slate-50' : ''}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Name */}
                      <td>
                        <div className="font-semibold text-slate-800">{row.fullName}</div>
                        <div className="text-xs text-slate-400">{row.admissionNumber}</div>
                      </td>

                      {/* CA */}
                      <td>
                        <input
                          type="number" min="0" max="100" step="0.5"
                          className="input w-20 text-center"
                          placeholder="—"
                          disabled={locked}
                          value={s.ca ?? ''}
                          onChange={(e) => setScore(row.studentId, 'ca', e.target.value)}
                        />
                      </td>

                      {/* Midterm */}
                      <td>
                        <input
                          type="number" min="0" max="100" step="0.5"
                          className="input w-20 text-center"
                          placeholder="—"
                          disabled={locked}
                          value={s.midterm ?? ''}
                          onChange={(e) => setScore(row.studentId, 'midterm', e.target.value)}
                        />
                      </td>

                      {/* Exam */}
                      <td>
                        <input
                          type="number" min="0" max="100" step="0.5"
                          className="input w-20 text-center"
                          placeholder="—"
                          disabled={locked}
                          value={s.exam ?? ''}
                          onChange={(e) => setScore(row.studentId, 'exam', e.target.value)}
                        />
                      </td>

                      {/* Aggregate */}
                      <td>
                        <span className={`font-bold text-base ${agg != null
                          ? (agg >= 60 ? 'text-emerald-600' : agg >= 40 ? 'text-amber-500' : 'text-red-500')
                          : 'text-slate-300'}`}>
                          {agg != null ? agg.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Letter grade */}
                      <td>
                        <span className={`font-extrabold text-lg ${cls}`}>{letter}</span>
                      </td>

                      {/* Remarks */}
                      <td>
                        <input
                          type="text"
                          maxLength={100}
                          className="input w-32 text-sm"
                          placeholder="Optional…"
                          disabled={locked}
                          value={s.remarks ?? ''}
                          onChange={(e) => setScore(row.studentId, 'remarks', e.target.value)}
                        />
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        {locked ? (
                          <Tooltip tip={`Finalized on ${new Date(row.finalizedAt).toLocaleDateString('en-GB')}`}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5
                                             bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5
                                           bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                            Draft
                          </span>
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

      {/* Finalize confirm modal */}
      <Modal
        isOpen={!!finalizeModal}
        onClose={() => setFinalizeModal(null)}
        title="Finalize Grade Sheet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            You are about to finalize <strong>all grades</strong> for{' '}
            {meta ? (
              <><strong>{meta.class?.name}</strong> — <strong>{meta.subject?.name}</strong></>
            ) : 'this sheet'}.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800
                          flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>This cannot be undone.</strong> Every grade in this sheet will be
              permanently locked. Make sure all scores are correct before continuing.
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              loading={finalizing}
              onClick={handleFinalize}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Lock className="w-4 h-4" /> Yes, Finalize
            </Button>
            <Button variant="secondary" onClick={() => setFinalizeModal(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
