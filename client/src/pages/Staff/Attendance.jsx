import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../api/attendance';
import Button from '../../components/ui/Button';
import { Save, Keyboard, ArrowUpDown } from 'lucide-react';

const STATUS_CONFIG = {
  PRESENT: { label: 'Present', bg: 'bg-emerald-100 border-emerald-400 text-emerald-700', row: 'bg-emerald-50' },
  ABSENT:  { label: 'Absent',  bg: 'bg-red-100 border-red-400 text-red-700',             row: 'bg-red-50/50' },
  TARDY:   { label: 'Tardy',   bg: 'bg-amber-100 border-amber-400 text-amber-700',       row: 'bg-amber-50/50' },
};

export default function StaffAttendance() {
  const [classId, setClassId] = useState('');
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster]   = useState([]);   // [{ student, status }]
  const [marks, setMarks]     = useState({});   // { studentId: 'PRESENT'|'ABSENT'|'TARDY' }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);

  async function loadRoster() {
    if (!classId.trim()) { toast.error('Enter a Class ID'); return; }
    setLoading(true);
    try {
      const res = await attendanceApi.forClass(classId, date);
      const r   = res.data.roster;
      setRoster(r);
      const initial = {};
      r.forEach((item) => { initial[item.student.id] = item.status || 'PRESENT'; });
      setMarks(initial);
      setFocusIdx(0);
    } catch { toast.error('Failed to load roster'); }
    finally { setLoading(false); }
  }

  // Keyboard shortcuts: P / A / T cycle through students
  const handleKey = useCallback((e) => {
    if (!roster.length) return;
    const student = roster[focusIdx]?.student;
    if (!student) return;
    const key = e.key.toUpperCase();
    if (['P', 'A', 'T'].includes(key)) {
      const statusMap = { P: 'PRESENT', A: 'ABSENT', T: 'TARDY' };
      setMarks((m) => ({ ...m, [student.id]: statusMap[key] }));
      setFocusIdx((i) => Math.min(i + 1, roster.length - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, roster.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, 0));
    }
  }, [roster, focusIdx]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  async function handleSubmit() {
    if (!roster.length) return;
    setSaving(true);
    try {
      const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
      await attendanceApi.submit({ date, records });
      toast.success(`Attendance saved for ${records.length} students`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally { setSaving(false); }
  }

  const counts = { PRESENT: 0, ABSENT: 0, TARDY: 0 };
  Object.values(marks).forEach((s) => { if (counts[s] != null) counts[s]++; });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Use P / A / T keys to mark quickly</p>
        </div>
        {roster.length > 0 && (
          <Button variant="accent" loading={saving} onClick={handleSubmit}>
            <Save className="w-4 h-4" /> Save Attendance
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Class ID</label>
            <input className="input w-56" placeholder="Paste Class ID…"
                   value={classId} onChange={(e) => setClassId(e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date}
                   onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadRoster} loading={loading}>Load Roster</Button>
        </div>
      </div>

      {/* Keyboard hint */}
      {roster.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-brand-50 rounded-xl text-sm text-brand-800 border border-brand-200 animate-fade-in">
          <span className="font-semibold">⌨️ Keyboard:</span>
          {[['P', 'Present', 'emerald'], ['A', 'Absent', 'red'], ['T', 'Tardy', 'amber']].map(([k, l, c]) => (
            <span key={k} className="flex items-center gap-1">
              <kbd className={`px-2 py-0.5 rounded font-mono text-xs font-bold border bg-${c}-100 text-${c}-700 border-${c}-400`}>{k}</kbd>
              <span className="text-slate-600">{l}</span>
            </span>
          ))}
          <span className="text-slate-500">↑↓ navigate</span>
        </div>
      )}

      {/* Summary bar */}
      {roster.length > 0 && (
        <div className="flex gap-4 flex-wrap animate-fade-in">
          {Object.entries(counts).map(([status, count]) => (
            <div key={status}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm
                             ${STATUS_CONFIG[status].bg}`}>
              <span>{count}</span>
              <span className="font-medium">{status.toLowerCase()}</span>
              <span className="opacity-60 text-xs">({roster.length > 0 ? Math.round(count / roster.length * 100) : 0}%)</span>
            </div>
          ))}
          <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
            {roster.length} total
          </div>
        </div>
      )}

      {/* Roster */}
      {roster.length > 0 && (
        <div className="card overflow-hidden animate-fade-in-up">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Tardy</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((item, idx) => {
                const sid    = item.student.id;
                const status = marks[sid] || 'PRESENT';
                const isFocus = idx === focusIdx;
                return (
                  <tr key={sid}
                      className={`transition-all duration-200 cursor-pointer
                                  ${STATUS_CONFIG[status].row}
                                  ${isFocus ? 'ring-2 ring-brand-400 ring-inset' : ''}`}
                      onClick={() => setFocusIdx(idx)}
                      style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="text-slate-400 text-xs w-10">{idx + 1}</td>
                    <td>
                      <div className="font-semibold text-slate-800">{item.student.fullName}</div>
                      <div className="text-xs text-slate-400">{item.student.admissionNumber}</div>
                    </td>
                    {['PRESENT', 'ABSENT', 'TARDY'].map((s) => (
                      <td key={s} className="text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMarks((m) => ({ ...m, [sid]: s })); }}
                          className={`w-8 h-8 rounded-lg border-2 font-bold text-xs transition-all duration-150
                                      active:scale-90
                                      ${status === s
                                        ? STATUS_CONFIG[s].bg + ' scale-110'
                                        : 'border-slate-200 text-slate-300 hover:border-slate-400'}`}
                        >
                          {s[0]}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {roster.length > 0 && (
        <div className="flex justify-end">
          <Button variant="accent" size="lg" loading={saving} onClick={handleSubmit}>
            💾 Save All Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
