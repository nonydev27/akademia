import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../api/attendance';
import { subjectsApi }   from '../../api/subjects';
import { staffApi }      from '../../api/staff';
import Button from '../../components/ui/Button';
import { KeyRound, CheckCircle2, UserCheck, UserX, Save, CalendarDays } from 'lucide-react';

export default function StaffAttendance() {
  // PIN gate
  const [subjectCode, setSubjectCode] = useState('');
  const [pin,         setPin]         = useState('');
  const [verifying,   setVerifying]   = useState(false);
  const [verified,    setVerified]    = useState(null);

  // Roster state
  const [myAssignments, setMyAssignments] = useState([]); // teacher's own assignments
  const [classId,  setClassId]  = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [roster,   setRoster]   = useState([]);   // [{ student, status }]
  const [marks,    setMarks]    = useState({});    // { studentId: 'PRESENT'|'ABSENT' }
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // Load only the teacher's own classes so they pick from a list (no UUIDs).
  const loadMyAssignments = useCallback(async () => {
    try {
      const res = await staffApi.mine();
      setMyAssignments(res.data.assignments || []);
    } catch { /* non-fatal */ }
  }, []);
  useEffect(() => { loadMyAssignments(); }, [loadMyAssignments]);

  const myClasses = Array.from(
    new Map(myAssignments.map((a) => [a.class.id, a.class])).values()
  );

  async function handleVerify(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) { toast.error('PIN must be 4 digits'); return; }
    setVerifying(true);
    try {
      const res = await subjectsApi.verifyByCode(subjectCode.trim().toUpperCase(), pin);
      setVerified(res.data.subject);
      toast.success(`Verified — ${res.data.subject.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setVerifying(false); }
  }

  async function loadRoster() {
    if (!classId.trim()) { toast.error('Enter a Class ID'); return; }
    setLoading(true);
    try {
      const res = await attendanceApi.forClass(classId.trim(), date, verified.id);
      const rows = res.data.roster;
      setRoster(rows);
      // Pre-fill existing marks
      const init = {};
      rows.forEach((r) => { if (r.status) init[r.student.id] = r.status; });
      setMarks(init);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load class');
    } finally { setLoading(false); }
  }

  function toggle(studentId, status) {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  }

  function markAll(status) {
    const all = {};
    roster.forEach((r) => { all[r.student.id] = status; });
    setMarks(all);
  }

  async function handleSubmit() {
    const records = roster.map((r) => ({
      studentId: r.student.id,
      status:    marks[r.student.id] || 'ABSENT',
    }));
    if (!records.length) { toast.error('No students to mark'); return; }
    setSaving(true);
    try {
      await attendanceApi.submit({ date, subjectId: verified.id, records });
      toast.success('Attendance submitted successfully');
      await loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally { setSaving(false); }
  }

  const presentCount = Object.values(marks).filter((s) => s === 'PRESENT').length;
  const absentCount  = Object.values(marks).filter((s) => s === 'ABSENT').length;

  // PIN gate screen
  if (!verified) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Subject Verification</h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter your subject code and PIN to mark attendance.
          </p>
          <form onSubmit={handleVerify} className="space-y-4 text-left">
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
                <CheckCircle2 className="w-4 h-4" /> Verify &amp; Continue
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

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-brand-700">{verified.name}</span>
            <code className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-mono">{verified.code}</code>
            <button onClick={() => { setVerified(null); setPin(''); setRoster([]); }}
              className="text-xs text-slate-400 hover:text-red-500 ml-2 underline">
              Switch subject
            </button>
          </div>
        </div>
        {roster.length > 0 && (
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            <Save className="w-4 h-4" /> Submit Attendance
          </Button>
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
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Date
            </label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadRoster} loading={loading}>Load Class</Button>
        </div>
      </div>

      {/* Stats + bulk actions */}
      {roster.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 text-sm">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-700">{presentCount} Present</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-xl border border-red-100 text-sm">
              <UserX className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-red-600">{absentCount} Absent</span>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => markAll('PRESENT')}>
              Mark All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAll('ABSENT')}
              className="text-red-600 border-red-200 hover:bg-red-50">
              Mark All Absent
            </Button>
          </div>
        </div>
      )}

      {/* Roster */}
      {roster.length > 0 && (
        <div className="card overflow-hidden animate-fade-in-up">
          <table className="table w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th className="text-center w-36">Present</th>
                <th className="text-center w-36">Absent</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((row, idx) => {
                const sid    = row.student.id;
                const status = marks[sid];
                return (
                  <tr key={sid} className={status === 'PRESENT' ? 'bg-emerald-50/40' : status === 'ABSENT' ? 'bg-red-50/40' : ''}>
                    <td className="text-slate-400 text-sm w-10">{idx + 1}</td>
                    <td>
                      <div className="font-semibold text-slate-800">{row.student.fullName}</div>
                      <div className="text-xs text-slate-400">{row.student.admissionNumber}</div>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => toggle(sid, 'PRESENT')}
                        className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center mx-auto
                          ${status === 'PRESENT'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-500'}`}
                      >
                        <UserCheck className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => toggle(sid, 'ABSENT')}
                        className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center mx-auto
                          ${status === 'ABSENT'
                            ? 'bg-red-500 border-red-500 text-white shadow-sm'
                            : 'border-slate-200 text-slate-300 hover:border-red-300 hover:text-red-500'}`}
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
