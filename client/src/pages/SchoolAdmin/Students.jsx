import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { studentsApi } from '../../api/students';
import DataTable   from '../../components/ui/DataTable';
import Modal       from '../../components/ui/Modal';
import Button      from '../../components/ui/Button';
import Input       from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  const [showAdd, setShowAdd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ admissionNumber: '', fullName: '', dateOfBirth: '', email: '' });

  const [selected, setSelected] = useState(null);  // student for detail panel
  const [detailLoading, setDetailLoading] = useState(false);
  const [guardianForm, setGuardianForm]   = useState({ fullName: '', phone: '', email: '', relation: '' });
  const [addingGuardian, setAddingGuardian] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsApi.list({ search, page, pageSize: 20 });
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchStudents(); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  async function openDetail(row) {
    setDetailLoading(true);
    setSelected(row);
    try {
      const res = await studentsApi.get(row.id);
      setSelected(res.data.student);
    } catch { toast.error('Failed to load student details'); }
    finally { setDetailLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await studentsApi.create({ ...form, dateOfBirth: form.dateOfBirth || undefined });
      toast.success('Student added! 🎉');
      setShowAdd(false);
      setForm({ admissionNumber: '', fullName: '', dateOfBirth: '', email: '' });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally { setSaving(false); }
  }

  async function handleDeactivate(id, name) {
    if (!window.confirm(`Deactivate ${name}? This cannot be undone from the UI.`)) return;
    try {
      await studentsApi.deactivate(id);
      toast.success('Student deactivated');
      fetchStudents();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    }
  }

  async function handleAddGuardian(e) {
    e.preventDefault();
    if (!selected) return;
    setAddingGuardian(true);
    try {
      await studentsApi.addGuardian(selected.id, guardianForm);
      toast.success('Guardian added ✅');
      setGuardianForm({ fullName: '', phone: '', email: '', relation: '' });
      openDetail(selected);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add guardian');
    } finally { setAddingGuardian(false); }
  }

  const columns = [
    { key: 'admissionNumber', label: 'Adm. No.' },
    { key: 'fullName',        label: 'Name',
      render: (v, row) => (
        <div>
          <div className="font-semibold text-slate-800">{v}</div>
          {row.email && <div className="text-xs text-slate-400">{row.email}</div>}
        </div>
      )},
    { key: 'enrollments', label: 'Class',
      render: (v) => v?.[0]?.class?.name || <span className="text-slate-300">—</span> },
    { key: 'feeBalance', label: 'Fee Balance',
      render: (v) => (
        <span className={`font-semibold ${v > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {v != null ? `GHS ${Number(v).toFixed(2)}` : '—'}
        </span>
      ) },
    { key: 'active', label: 'Status',
      render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'EXPIRED_LOCKED'} label={v ? 'Active' : 'Inactive'} /> },
    { key: 'id', label: '',
      render: (id, row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDetail(row); }}>
            View
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDeactivate(id, row.fullName); }}>
            ×
          </Button>
        </div>
      )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} student{total !== 1 ? 's' : ''} enrolled</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>+ Add Student</Button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input className="input max-w-sm"
               placeholder="🔍  Search by name or admission number…"
               value={search}
               onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card p-5 animate-fade-in-up">
        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          total={total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          emptyMessage="No students found"
          emptyIcon="👨‍🎓"
          onRowClick={openDetail}
        />
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Student">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Admission Number" value={form.admissionNumber}
            onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} required />
          <Input label="Full Name" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label="Date of Birth (optional)" type="date" value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          <Input label="Student Email (optional)" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">Add Student</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Student Detail Side Panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/50 animate-fade-in" />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-slide-in-right"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              {/* Close */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
                <Button variant="ghost" onClick={() => setSelected(null)}>✕</Button>
              </div>

              {detailLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
                </div>
              ) : (
                <>
                  {/* Bio */}
                  <div className="card p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-800
                                      flex items-center justify-center text-white font-bold text-lg">
                        {selected.fullName?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{selected.fullName}</div>
                        <div className="text-xs text-slate-500">{selected.admissionNumber}</div>
                      </div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      {selected.email && (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Email</dt>
                          <dd className="text-slate-700">{selected.email}</dd>
                        </div>
                      )}
                      {selected.dateOfBirth && (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Date of Birth</dt>
                          <dd className="text-slate-700">{new Date(selected.dateOfBirth).toLocaleDateString()}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Class</dt>
                        <dd className="text-slate-700">{selected.enrollments?.[0]?.class?.name || '—'}</dd>
                      </div>
                      {selected.feeBalance != null && (
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Fee Balance</dt>
                          <dd className={`font-bold ${selected.feeBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            GHS {Number(selected.feeBalance).toFixed(2)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Guardians */}
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Guardians</h3>
                    {selected.guardians?.length ? (
                      <div className="space-y-2">
                        {selected.guardians.map((sg) => (
                          <div key={sg.id} className="px-4 py-3 rounded-xl bg-slate-50 text-sm">
                            <div className="font-semibold">{sg.guardian?.fullName}</div>
                            <div className="text-slate-500">{sg.guardian?.phone} · {sg.relation || 'Guardian'}</div>
                            {sg.guardian?.email && <div className="text-slate-400 text-xs">{sg.guardian.email}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm">No guardians linked.</p>
                    )}

                    {/* Add Guardian Form */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-900">
                        + Add Guardian
                      </summary>
                      <form onSubmit={handleAddGuardian} className="space-y-3 mt-3">
                        <Input label="Full Name" value={guardianForm.fullName}
                          onChange={(e) => setGuardianForm({ ...guardianForm, fullName: e.target.value })} required />
                        <Input label="Phone Number" value={guardianForm.phone}
                          onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })} required />
                        <Input label="Email (optional)" type="email" value={guardianForm.email}
                          onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })} />
                        <Input label="Relationship" value={guardianForm.relation}
                          placeholder="e.g. Mother, Father"
                          onChange={(e) => setGuardianForm({ ...guardianForm, relation: e.target.value })} />
                        <Button type="submit" variant="primary" size="sm" loading={addingGuardian}>
                          Add Guardian
                        </Button>
                      </form>
                    </details>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
