import { useState } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../api/attendance';
import StatusBadge from '../../components/ui/StatusBadge';

export default function AdminAttendance() {
  const [classId, setClassId] = useState('');
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster]   = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadRoster() {
    if (!classId.trim()) { toast.error('Enter a Class ID'); return; }
    setLoading(true);
    try {
      const res = await attendanceApi.forClass(classId, date);
      setRoster(res.data.roster);
    } catch { toast.error('Failed to load roster'); }
    finally { setLoading(false); }
  }

  const counts = { PRESENT: 0, ABSENT: 0, TARDY: 0 };
  roster.forEach((r) => { if (r.status && counts[r.status] != null) counts[r.status]++; });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">View class attendance records</p>
        </div>
      </div>

      <div className="card p-5 animate-fade-in-up">
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
          <button className="btn-primary btn" onClick={loadRoster}>Load Roster</button>
        </div>
      </div>

      {roster.length > 0 && (
        <div className="card p-5 animate-fade-in-up">
          {/* Summary bar */}
          <div className="flex gap-4 mb-4 flex-wrap">
            {[
              { s: 'PRESENT', count: counts.PRESENT, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { s: 'ABSENT',  count: counts.ABSENT,  bg: 'bg-red-50 text-red-700 border-red-200' },
              { s: 'TARDY',   count: counts.TARDY,   bg: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map((b) => (
              <div key={b.s} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${b.bg}`}>
                {b.count} {b.s.toLowerCase()}
              </div>
            ))}
          </div>

          <div className="table-container">
            <table className="table">
              <thead><tr><th>Student</th><th>Adm. No.</th><th>Status</th></tr></thead>
              <tbody>
                {roster.map((r, i) => (
                  <tr key={r.student.id} style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="font-medium">{r.student.fullName}</td>
                    <td className="text-slate-400">{r.student.admissionNumber}</td>
                    <td>{r.status ? <StatusBadge status={r.status} /> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
