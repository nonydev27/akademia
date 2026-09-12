import { useState } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../api/attendance';
import Button from '../../components/ui/Button';
import { BarChart3, UserCheck, UserX, CalendarDays, Search } from 'lucide-react';

export default function AdminAttendance() {
  const [classId,  setClassId]  = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [summary,  setSummary]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  async function loadSummary() {
    if (!classId.trim()) { toast.error('Enter a Class ID'); return; }
    setLoading(true);
    setSearched(false);
    try {
      const res = await attendanceApi.summary(classId.trim(), {
        fromDate: fromDate || undefined,
        toDate:   toDate   || undefined,
      });
      setSummary(res.data.summary);
      setSearched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance summary');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Summary</h1>
          <p className="page-subtitle">Overview of attendance per student. Teachers mark daily attendance.</p>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <BarChart3 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          As admin you can view attendance summaries. Only teachers can mark student attendance for their assigned subjects.
        </p>
      </div>

      {/* Filter */}
      <div className="card p-5">
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Class ID</label>
            <input className="input font-mono text-xs" placeholder="Paste Class UUID…"
              value={classId} onChange={(e) => setClassId(e.target.value)} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> From Date
            </label>
            <input type="date" className="input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <Button variant="primary" onClick={loadSummary} loading={loading}>
            <Search className="w-4 h-4" /> Load Summary
          </Button>
        </div>
      </div>

      {/* Summary table */}
      {searched && (
        <div className="card overflow-hidden animate-fade-in-up">
          {summary.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-slate-400">
              <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No attendance records found for this class</p>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th className="text-center">Total Sessions</th>
                  <th className="text-center">Present</th>
                  <th className="text-center">Absent</th>
                  <th className="text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={s.student.id} style={{ animationDelay: `${i * 30}ms` }}>
                    <td>
                      <div className="font-semibold text-slate-800">{s.student.fullName}</div>
                      <div className="text-xs text-slate-400">{s.student.admissionNumber}</div>
                    </td>
                    <td className="text-center font-semibold text-slate-700">{s.total}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <UserCheck className="w-3 h-3" /> {s.present}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                        <UserX className="w-3 h-3" /> {s.absent}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${s.percentage >= 75 ? 'bg-emerald-500' : s.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${s.percentage}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${s.percentage >= 75 ? 'text-emerald-700' : s.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {s.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
