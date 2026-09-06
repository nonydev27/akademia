import { useState } from 'react';
import toast from 'react-hot-toast';
import { gradesApi } from '../../api/grades';
import Button from '../../components/ui/Button';
import Modal  from '../../components/ui/Modal';
import { Check } from 'lucide-react';

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
  const [classId, setClassId]   = useState('');
  const [termId, setTermId]     = useState('');
  const [sheet, setSheet]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [finalizing, setFinalizing] = useState(false);

  async function loadSheet() {
    if (!classId.trim() || !termId.trim()) { toast.error('Enter both Class ID and Term ID'); return; }
    setLoading(true);
    try {
      const res = await gradesApi.classSheet(classId, termId);
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
            <label className="label">Class ID</label>
            <input className="input w-52" placeholder="Paste Class ID…"
                   value={classId} onChange={(e) => setClassId(e.target.value)} />
          </div>
          <div>
            <label className="label">Term ID</label>
            <input className="input w-52" placeholder="Paste Term ID…"
                   value={termId} onChange={(e) => setTermId(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadSheet} loading={loading}>Load Sheet</Button>
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
                        {g.aggregate ?? '—'} ({gradeLetter(g.aggregate)})
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
    </div>
  );
}
