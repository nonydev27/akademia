import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { studentsApi } from '../../api/students';
import { gradesApi }   from '../../api/grades';
import Button from '../../components/ui/Button';
import Modal  from '../../components/ui/Modal';
import { Save, Lock, AlertTriangle } from 'lucide-react';

function computeAggregate(ca, exam) {
  const c = parseFloat(ca);
  const e = parseFloat(exam);
  if (isNaN(c) || isNaN(e)) return null;
  return Math.round((c * 0.3 + e * 0.7) * 100) / 100;
}

function gradeLetter(agg) {
  if (agg == null) return '—';
  if (agg >= 80) return { l: 'A', cls: 'score-a' };
  if (agg >= 70) return { l: 'B', cls: 'score-b' };
  if (agg >= 60) return { l: 'C', cls: 'score-c' };
  if (agg >= 50) return { l: 'D', cls: 'score-d' };
  return { l: 'F', cls: 'score-f' };
}

export default function GradeEntry() {
  const [classId, setClassId]   = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId]     = useState('');
  const [students, setStudents] = useState([]);
  const [scores, setScores]     = useState({});  // { studentId: { ca, exam } }
  const [saving, setSaving]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [finalizeModal, setFinalizeModal] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  async function loadStudents() {
    if (!classId.trim()) { toast.error('Enter Class ID'); return; }
    setLoading(true);
    try {
      const res = await studentsApi.list({ pageSize: 100 });
      const list = res.data.students;
      setStudents(list);
      const initial = {};
      list.forEach((s) => { initial[s.id] = { ca: '', exam: '' }; });
      setScores(initial);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }

  function setScore(sid, field, val) {
    setScores((prev) => ({ ...prev, [sid]: { ...prev[sid], [field]: val } }));
  }

  async function saveRow(student) {
    const { ca, exam } = scores[student.id] || {};
    if (!subjectId || !termId) { toast.error('Enter Subject ID and Term ID'); return; }

    setSaving((s) => ({ ...s, [student.id]: true }));
    try {
      const promises = [];
      if (ca !== '' && !isNaN(parseFloat(ca))) {
        promises.push(gradesApi.submitCa({
          studentId: student.id, subjectId, termId, caScore: parseFloat(ca),
        }));
      }
      if (exam !== '' && !isNaN(parseFloat(exam))) {
        promises.push(gradesApi.submitExam({
          studentId: student.id, subjectId, termId, examScore: parseFloat(exam),
        }));
      }
      await Promise.all(promises);
      toast.success(`${student.fullName.split(' ')[0]}'s scores saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving((s) => ({ ...s, [student.id]: false }));
    }
  }

  async function saveAll() {
    for (const student of students) {
      await saveRow(student);
      await new Promise((r) => setTimeout(r, 200));
    }
    toast.success('All scores saved!');
  }

  async function handleFinalize() {
    if (!finalizeModal) return;
    setFinalizing(true);
    try {
      const res = await gradesApi.finalize(finalizeModal.id, termId);
      toast.success(res.data.message);
      setFinalizeModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    } finally { setFinalizing(false); }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grade Entry</h1>
          <p className="page-subtitle">Submit CA and exam scores · CA=30%, Exam=70%</p>
        </div>
        {students.length > 0 && (
          <Button variant="accent" onClick={saveAll}><Save className="w-4 h-4" /> Save All</Button>
        )}
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Class ID</label>
            <input className="input" placeholder="Paste Class ID…"
                   value={classId} onChange={(e) => setClassId(e.target.value)} />
          </div>
          <div>
            <label className="label">Subject ID</label>
            <input className="input" placeholder="Paste Subject ID…"
                   value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
          </div>
          <div>
            <label className="label">Term ID</label>
            <input className="input" placeholder="Paste Term ID…"
                   value={termId} onChange={(e) => setTermId(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadStudents} loading={loading}>Load Students</Button>
        </div>
      </div>

      {/* Grade entry table */}
      {students.length > 0 && (
        <div className="card overflow-hidden animate-fade-in-up">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>CA Score <span className="text-slate-400 font-normal">(0–100)</span></th>
                <th>Exam Score <span className="text-slate-400 font-normal">(0–100)</span></th>
                <th>Aggregate</th>
                <th>Grade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const { ca = '', exam = '' } = scores[s.id] || {};
                const agg  = computeAggregate(ca, exam);
                const letter = gradeLetter(agg);
                return (
                  <tr key={s.id} style={{ animationDelay: `${idx * 30}ms` }}>
                    <td>
                      <div className="font-semibold">{s.fullName}</div>
                      <div className="text-xs text-slate-400">{s.admissionNumber}</div>
                    </td>
                    <td>
                      <input
                        type="number" min="0" max="100" step="0.5"
                        className="input w-24 text-center"
                        placeholder="—"
                        value={ca}
                        onChange={(e) => setScore(s.id, 'ca', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number" min="0" max="100" step="0.5"
                        className="input w-24 text-center"
                        placeholder="—"
                        value={exam}
                        onChange={(e) => setScore(s.id, 'exam', e.target.value)}
                      />
                    </td>
                    <td>
                      <span className={`font-bold text-base ${agg != null ? (agg >= 60 ? 'text-emerald-600' : agg >= 40 ? 'text-amber-600' : 'text-red-600') : 'text-slate-300'}`}>
                        {agg ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`font-bold text-base ${typeof letter === 'object' ? letter.cls : 'text-slate-300'}`}>
                        {typeof letter === 'object' ? letter.l : letter}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="primary" loading={!!saving[s.id]} onClick={() => saveRow(s)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setFinalizeModal(s)}
                                title="Finalize grades for this student">
                          <Lock className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Finalize confirm */}
      <Modal isOpen={!!finalizeModal} onClose={() => setFinalizeModal(null)} title="Finalize Grades" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Finalize grades for <strong>{finalizeModal?.fullName}</strong>?
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><strong>This cannot be undone.</strong> Finalized grades cannot be edited.
            Make sure all scores are correct before finalizing.</span>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" loading={finalizing} onClick={handleFinalize} className="flex-1">
              Finalize Grades
            </Button>
            <Button variant="secondary" onClick={() => setFinalizeModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
