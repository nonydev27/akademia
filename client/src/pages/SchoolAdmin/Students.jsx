import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { studentsApi } from '../../api/students';
import DataTable   from '../../components/ui/DataTable';
import Modal       from '../../components/ui/Modal';
import Button      from '../../components/ui/Button';
import Input       from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  Plus, Search, X, Users, UserCircle,
  GraduationCap, Trophy, IdCard, Eye, ChevronRight, ChevronLeft, Pencil,
} from 'lucide-react';

const STEPS = [
  { id: 'personal',      label: 'Personal',       icon: UserCircle },
  { id: 'academic',      label: 'Academic',        icon: GraduationCap },
  { id: 'cocurricular',  label: 'Co-Curricular',   icon: Trophy },
  { id: 'identification',label: 'Identification',  icon: IdCard },
  { id: 'preview',       label: 'Preview',         icon: Eye },
];

const EMPTY_FORM = {
  admissionNumber: '', fullName: '', dateOfBirth: '', gender: '',
  nationality: '', religion: '', address: '', email: '', phone: '',
  previousSchool: '', classId: '',
  sports: '', clubs: '', otherActivities: '',
  nhisNumber: '', profilePicUrl: '',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  const [showAdd,  setShowAdd]  = useState(false);
  const [step,     setStep]     = useState(0);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  const [selected,       setSelected]       = useState(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [editingField,   setEditingField]   = useState(null);
  const [editValue,      setEditValue]      = useState('');
  const [savingEdit,     setSavingEdit]     = useState(false);

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
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  async function openDetail(row) {
    setDetailLoading(true);
    setSelected(row);
    try {
      const res = await studentsApi.get(row.id);
      setSelected(res.data.student);
    } catch { toast.error('Failed to load student details'); }
    finally { setDetailLoading(false); }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setStep(0);
    setShowAdd(true);
  }

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await studentsApi.create({
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        email:       form.email || undefined,
        classId:     form.classId || undefined,
      });
      toast.success('Student added successfully');
      setShowAdd(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally { setSaving(false); }
  }

  async function saveField(studentId) {
    if (!editingField) return;
    setSavingEdit(true);
    try {
      await studentsApi.update(studentId, { [editingField]: editValue || null });
      toast.success('Updated');
      setEditingField(null);
      openDetail({ id: studentId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSavingEdit(false); }
  }

  const columns = [
    { key: 'admissionNumber', label: 'Adm. No.' },
    { key: 'fullName', label: 'Name',
      render: (v, row) => (
        <div>
          <div className="font-semibold text-slate-800">{v}</div>
          {row.email && <div className="text-xs text-slate-400">{row.email}</div>}
        </div>
      )},
    { key: 'enrollments', label: 'Class',
      render: (v) => v?.[0]?.class?.name || <span className="text-slate-300">—</span> },
    { key: 'gender', label: 'Gender',
      render: (v) => v || <span className="text-slate-300">—</span> },
    { key: 'active', label: 'Status',
      render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'EXPIRED_LOCKED'} label={v ? 'Active' : 'Inactive'} /> },
    { key: 'id', label: '',
      render: (id, row) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDetail(row); }}>
          View
        </Button>
      )},
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{total} student{total !== 1 ? 's' : ''} enrolled</p>
        </div>
        <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Student</Button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or admission number…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card p-5 animate-fade-in-up">
        <DataTable columns={columns} data={students} loading={loading} total={total}
          page={page} pageSize={20} onPageChange={setPage}
          emptyMessage="No students found" emptyIcon={<Users className="w-12 h-12" />}
          onRowClick={openDetail} />
      </div>

      {/* Multi-step Add Student Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Student" size="lg">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive   = idx === step;
            const isComplete = idx < step;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => idx < step && setStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                    ${isActive   ? 'bg-brand-600 text-white shadow-sm' : ''}
                    ${isComplete ? 'bg-brand-100 text-brand-700 cursor-pointer' : ''}
                    ${!isActive && !isComplete ? 'bg-slate-100 text-slate-400 cursor-default' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step 0: Personal */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Admission Number *" value={form.admissionNumber}
                onChange={(e) => setField('admissionNumber', e.target.value)} required />
              <Input label="Full Name *" value={form.fullName}
                onChange={(e) => setField('fullName', e.target.value)} required />
              <Input label="Date of Birth" type="date" value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)} />
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                  <option value="">Select…</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <Input label="Nationality" value={form.nationality}
                onChange={(e) => setField('nationality', e.target.value)} />
              <Input label="Religion" value={form.religion}
                onChange={(e) => setField('religion', e.target.value)} />
              <Input label="Phone Number" type="tel" value={form.phone}
                onChange={(e) => setField('phone', e.target.value)} />
              <Input label="Email Address" type="email" value={form.email}
                onChange={(e) => setField('email', e.target.value)} />
            </div>
            <Input label="Home Address" value={form.address}
              onChange={(e) => setField('address', e.target.value)} />
          </div>
        )}

        {/* Step 1: Academic */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              If this student was at another school before, enter it below. Otherwise leave it blank.
            </p>
            <Input label="Name of Previous School" value={form.previousSchool}
              placeholder="Leave blank if not applicable"
              onChange={(e) => setField('previousSchool', e.target.value)} />
            <Input label="Class ID (optional)" value={form.classId}
              placeholder="UUID of the class to enroll in"
              onChange={(e) => setField('classId', e.target.value)} />
          </div>
        )}

        {/* Step 2: Co-curricular */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Record the student's extracurricular activities.</p>
            <div>
              <label className="label">Sports</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="e.g. Football, Athletics…"
                value={form.sports} onChange={(e) => setField('sports', e.target.value)} />
            </div>
            <div>
              <label className="label">Clubs &amp; Societies</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="e.g. Science Club, Debate…"
                value={form.clubs} onChange={(e) => setField('clubs', e.target.value)} />
            </div>
            <div>
              <label className="label">Other Activities</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="Any other activities or interests…"
                value={form.otherActivities} onChange={(e) => setField('otherActivities', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3: Identification */}
        {step === 3 && (
          <div className="space-y-4">
            <Input label="NHIS Number" value={form.nhisNumber}
              placeholder="National Health Insurance Scheme number"
              onChange={(e) => setField('nhisNumber', e.target.value)} />
            <Input label="Profile Picture URL" value={form.profilePicUrl}
              placeholder="https://…  (upload to Supabase Storage first)"
              onChange={(e) => setField('profilePicUrl', e.target.value)} />
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {form.profilePicUrl ? (
                <img src={form.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-brand-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700
                                flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {form.fullName?.[0] || '?'}
                </div>
              )}
              <div>
                <div className="text-xl font-bold text-slate-900">{form.fullName || '—'}</div>
                <div className="text-sm text-slate-500">{form.admissionNumber}</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['Date of Birth', form.dateOfBirth], ['Gender', form.gender],
                ['Nationality', form.nationality], ['Religion', form.religion],
                ['Phone', form.phone], ['Email', form.email],
                ['Address', form.address], ['Previous School', form.previousSchool],
                ['Sports', form.sports], ['Clubs', form.clubs],
                ['Other Activities', form.otherActivities], ['NHIS No.', form.nhisNumber],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex gap-2">
                  <span className="text-slate-400 flex-shrink-0">{label}:</span>
                  <span className="text-slate-700 font-medium">{val}</span>
                </div>
              ) : null)}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary"
              disabled={step === 0 && (!form.admissionNumber || !form.fullName)}
              onClick={() => setStep((s) => s + 1)}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Save Student
            </Button>
          )}
        </div>
      </Modal>

      {/* Student Detail Side Panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => { setSelected(null); setEditingField(null); }}>
          <div className="flex-1 bg-black/50 animate-fade-in" />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl animate-slide-in-right"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
                <Button variant="ghost" onClick={() => { setSelected(null); setEditingField(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {detailLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    {selected.profilePicUrl ? (
                      <img src={selected.profilePicUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-brand-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-800
                                      flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {selected.fullName?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-lg">{selected.fullName}</div>
                      <div className="text-xs text-slate-500">{selected.admissionNumber}</div>
                      <div className="text-xs text-slate-400">{selected.enrollments?.[0]?.class?.name || 'No class'}</div>
                    </div>
                  </div>

                  {/* Editable fields */}
                  {[
                    { section: 'Personal', fields: [
                      { key: 'fullName', label: 'Full Name' },
                      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                      { key: 'gender', label: 'Gender' },
                      { key: 'nationality', label: 'Nationality' },
                      { key: 'religion', label: 'Religion' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'email', label: 'Email' },
                      { key: 'address', label: 'Address' },
                    ]},
                    { section: 'Academic', fields: [
                      { key: 'previousSchool', label: 'Previous School' },
                    ]},
                    { section: 'Co-Curricular', fields: [
                      { key: 'sports', label: 'Sports' },
                      { key: 'clubs', label: 'Clubs' },
                      { key: 'otherActivities', label: 'Other Activities' },
                    ]},
                    { section: 'Identification', fields: [
                      { key: 'nhisNumber', label: 'NHIS Number' },
                    ]},
                  ].map(({ section, fields }) => (
                    <div key={section}>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{section}</h3>
                      <div className="card p-3 space-y-1">
                        {fields.map(({ key, label, type }) => (
                          <div key={key} className="flex items-center gap-2 py-1">
                            <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
                            {editingField === key ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input type={type || 'text'}
                                  className="input text-xs py-1 flex-1"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  autoFocus
                                />
                                <Button size="sm" variant="primary" loading={savingEdit}
                                  onClick={() => saveField(selected.id)}>Save</Button>
                                <Button size="sm" variant="ghost"
                                  onClick={() => setEditingField(null)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-sm text-slate-700 flex-1 truncate">
                                  {selected[key]
                                    ? (key === 'dateOfBirth' ? new Date(selected[key]).toLocaleDateString() : selected[key])
                                    : <span className="text-slate-300 italic">—</span>}
                                </span>
                                <button
                                  onClick={() => { setEditingField(key); setEditValue(selected[key] || ''); }}
                                  className="text-slate-400 hover:text-brand-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Fee balance */}
                  {selected.feeBalance != null && (
                    <div className="card p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Fee Balance</span>
                        <span className={`font-bold ${selected.feeBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          GHS {Number(selected.feeBalance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
