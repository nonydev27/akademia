import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { staffApi } from '../../api/staff';
import Modal   from '../../components/ui/Modal';
import Button  from '../../components/ui/Button';
import Input   from '../../components/ui/Input';
import Tooltip from '../../components/ui/Tooltip';
import {
  Plus, Users2, BookOpen, Trash2, CheckCircle2,
  UserX, UserCheck, Link2, Unlink,
} from 'lucide-react';

// ─── Helper: active badge ─────────────────────────────────────────────────────
function ActiveBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400 line-through'}`}
    >
      {active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StaffManagement() {
  const [tab, setTab] = useState('teachers'); // 'teachers' | 'assignments'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">
            Manage teacher accounts and assign them to classes &amp; subjects
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'teachers',    icon: <Users2  className="w-4 h-4" />, label: 'Teachers' },
          { id: 'assignments', icon: <BookOpen className="w-4 h-4" />, label: 'Assignments' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                        transition-all duration-200
                        ${tab === t.id
                          ? 'bg-white text-brand-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'teachers'    && <TeachersTab />}
      {tab === 'assignments' && <AssignmentsTab />}
    </div>
  );
}

// ─── Teachers Tab ─────────────────────────────────────────────────────────────
function TeachersTab() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deactivating, setDeactivating] = useState(null);

  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffApi.list();
      setTeachers(res.data.teachers);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await staffApi.create(form);
      toast.success(`Teacher account created for ${form.fullName}!`);
      setShowAdd(false);
      setForm({ fullName: '', email: '', password: '', phone: '' });
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(teacher) {
    if (!window.confirm(`Deactivate ${teacher.fullName}? Their login will be disabled immediately.`)) return;
    setDeactivating(teacher.id);
    try {
      await staffApi.deactivate(teacher.id);
      toast.success(`${teacher.fullName} deactivated`);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate teacher');
    } finally {
      setDeactivating(null);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} registered
        </p>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <Users2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No teachers added yet</p>
            <p className="text-xs mt-1">Click "Add Teacher" to create the first account</p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Email</th>
                <th>Assignments</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => (
                <tr key={t.id} style={{ animationDelay: `${i * 40}ms` }}>
                  {/* Name */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center
                                   text-xs font-bold text-white flex-shrink-0
                                   bg-gradient-to-br from-brand-600 to-indigo-700"
                      >
                        {t.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{t.fullName}</div>
                        <div className="text-xs text-slate-400">
                          Joined {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="text-slate-600 text-sm">{t.email}</td>

                  {/* Assignments summary */}
                  <td>
                    {t.teacherAssignments?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.teacherAssignments.slice(0, 3).map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5
                                       bg-brand-50 text-brand-700 text-xs rounded-lg font-medium"
                          >
                            {a.class?.name} – {a.subject?.name}
                          </span>
                        ))}
                        {t.teacherAssignments.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{t.teacherAssignments.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No assignments yet</span>
                    )}
                  </td>

                  {/* Status */}
                  <td><ActiveBadge active={t.active} /></td>

                  {/* Action */}
                  <td className="text-right">
                    {t.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={deactivating === t.id}
                        onClick={() => handleDeactivate(t)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add New Teacher"
        size="sm"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-sm text-slate-500">
            This creates a login account for the teacher. Share the email and
            password with them so they can sign in.
          </p>

          <div>
            <label className="label flex items-center gap-1.5">
              Full Name <span className="text-red-500">*</span>
              <Tooltip tip="The teacher's full name as it will appear in the system and on grade sheets." />
            </label>
            <Input
              name="fullName"
              placeholder="e.g. Ama Owusu"
              value={form.fullName}
              onChange={handleFormChange}
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              Email Address <span className="text-red-500">*</span>
              <Tooltip tip="This email is used to log in. Use the teacher's real email address." />
            </label>
            <Input
              type="email"
              name="email"
              placeholder="teacher@yourschool.edu.gh"
              value={form.email}
              onChange={handleFormChange}
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              Phone Number
              <Tooltip tip="Optional. Used for contact purposes." />
            </label>
            <Input
              type="tel"
              name="phone"
              placeholder="e.g. 0244123456"
              value={form.phone}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              Temporary Password <span className="text-red-500">*</span>
              <Tooltip tip="Must be at least 8 characters. Share this with the teacher and ask them to change it after first login." />
            </label>
            <Input
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleFormChange}
              minLength={8}
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Ask the teacher to change this after their first login.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              Create Account
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Assignments Tab ──────────────────────────────────────────────────────────
function AssignmentsTab() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showAssign, setShowAssign]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [removing, setRemoving]       = useState(null);

  const [form, setForm] = useState({ teacherId: '', classId: '', subjectId: '' });

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffApi.listAssignments({});
      setAssignments(res.data.assignments);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (!form.teacherId || !form.classId || !form.subjectId) {
      toast.error('Please fill in all three fields');
      return;
    }
    setSaving(true);
    try {
      await staffApi.assign(form);
      toast.success('Assignment created!', { icon: <Link2 className="w-4 h-4" /> });
      setShowAssign(false);
      setForm({ teacherId: '', classId: '', subjectId: '' });
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(assignment) {
    if (!window.confirm(
      `Remove ${assignment.teacher?.fullName} from ${assignment.class?.name} – ${assignment.subject?.name}?`
    )) return;
    setRemoving(assignment.id);
    try {
      await staffApi.removeAssignment(assignment.id);
      toast.success('Assignment removed');
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove assignment');
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} configured
        </p>
        <Button variant="primary" onClick={() => setShowAssign(true)}>
          <Plus className="w-4 h-4" /> Assign Teacher
        </Button>
      </div>

      {/* Explainer */}
      <div className="flex gap-3 p-4 bg-brand-50 rounded-2xl border border-brand-100 animate-fade-in">
        <Link2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          Each assignment gives a teacher permission to enter grades for one specific
          Class + Subject combination. A teacher cannot edit another teacher's grade sheet.
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No assignments configured yet</p>
            <p className="text-xs mt-1">Use "Assign Teacher" to grant access to a class + subject</p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Class</th>
                <th>Subject</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={a.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <td>
                    <div className="font-semibold text-slate-800">{a.teacher?.fullName}</div>
                    <div className="text-xs text-slate-400">{a.teacher?.email}</div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg
                                     bg-slate-100 text-slate-700 text-xs font-medium">
                      {a.class?.name}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg
                                     bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {a.subject?.name}
                    </span>
                  </td>
                  <td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={removing === a.id}
                      onClick={() => handleRemove(a)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Unlink className="w-3.5 h-3.5" /> Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        title="Assign Teacher to Class + Subject"
        size="sm"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <p className="text-sm text-slate-500">
            Paste the IDs from Prisma Studio (<code className="text-xs bg-slate-100 px-1 rounded">npx prisma studio</code>)
            or from the API. The assignment is idempotent — creating the same one twice is safe.
          </p>

          <div>
            <label className="label flex items-center gap-1.5">
              Teacher ID (UUID) <span className="text-red-500">*</span>
              <Tooltip tip="Copy the teacher's ID from the Teachers tab above, or from Prisma Studio → User table." />
            </label>
            <Input
              name="teacherId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.teacherId}
              onChange={handleFormChange}
              className="font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              Class ID (UUID) <span className="text-red-500">*</span>
              <Tooltip tip="The class the teacher will teach (e.g. JHS 2). Find the ID in Prisma Studio → Class table." />
            </label>
            <Input
              name="classId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.classId}
              onChange={handleFormChange}
              className="font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              Subject ID (UUID) <span className="text-red-500">*</span>
              <Tooltip tip="The subject the teacher will enter grades for (e.g. Mathematics). Find it in Prisma Studio → Subject table." />
            </label>
            <Input
              name="subjectId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={form.subjectId}
              onChange={handleFormChange}
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              <Link2 className="w-4 h-4" /> Assign
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAssign(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
