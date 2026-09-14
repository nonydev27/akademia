import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { termsApi } from '../../api/terms';
import { classesApi } from '../../api/classes';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Plus, Pencil, Trash2, Check, X, Calendar, Clock, Hash, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active (ongoing)', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-slate-100 text-slate-500' },
  { value: 'UPCOMING', label: 'Upcoming', color: 'bg-amber-100 text-amber-700' },
];

export default function Terms() {
  const [terms, setTerms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [showAddYear, setShowAddYear] = useState(false);
  const [yearLabel, setYearLabel] = useState('');
  const [savingYear, setSavingYear] = useState(false);

  const [form, setForm] = useState({ academicYearId: '', label: '', status: 'UPCOMING', startDate: '', endDate: '' });

  async function fetchTerms() {
    setLoading(true);
    try {
      const res = await termsApi.list();
      setTerms(res.data.terms || []);
      setAcademicYears(res.data.academicYears || []);
      if (!form.academicYearId && res.data.academicYears?.length) {
        setForm((prev) => ({ ...prev, academicYearId: res.data.academicYears[0].id }));
      }
    } catch { toast.error('Failed to load terms'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchTerms(); }, []); // eslint-disable-line

  function openAdd() {
    const defaultYear = academicYears.length ? academicYears[0].id : '';
    setForm({ academicYearId: defaultYear, label: '', status: 'UPCOMING', startDate: '', endDate: '' });
    setShowAdd(true);
  }

  function openEdit(term) {
    setForm({
      academicYearId: term.academicYearId || '',
      label: term.termLabel || term.label,
      status: term.status || 'UPCOMING',
      startDate: term.startDate?.slice(0, 10) || '',
      endDate: term.endDate?.slice(0, 10) || '',
    });
    setEditing(term);
    setShowAdd(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await termsApi.update(editing.id, { ...form, academicYearId: undefined });
        toast.success('Term updated');
      } else {
        await termsApi.create(form);
        toast.success('Term created');
      }
      setShowAdd(false);
      setEditing(null);
      fetchTerms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save term');
    } finally { setSaving(false); }
  }

  async function handleSetActive(term) {
    try {
      await termsApi.update(term.id, { status: 'ACTIVE' });
      toast.success(`${term.label} is now active`);
      fetchTerms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate term');
    }
  }

  async function handleDelete(term) {
    if (!window.confirm(`Delete "${term.label}"? This cannot be undone.`)) return;
    setRemoving(term.id);
    try {
      await termsApi.remove(term.id);
      toast.success('Term deleted');
      fetchTerms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete term');
    } finally { setRemoving(null); }
  }

  const statusInfo = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt || STATUS_OPTIONS[2];
  };

  async function handleSaveYear(e) {
    e.preventDefault();
    setSavingYear(true);
    try {
      await termsApi.createAcademicYear({ label: yearLabel.trim() });
      toast.success('Academic year created');
      setShowAddYear(false);
      setYearLabel('');
      fetchTerms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create academic year');
    } finally { setSavingYear(false); }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Terms & Semesters</h1>
          <p className="page-subtitle">Manage academic terms — activate which one is currently ongoing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setYearLabel(''); setShowAddYear(true); }}>
            <Plus className="w-4 h-4" /> New Academic Year
          </Button>
          <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Term</Button>
        </div>
      </div>

      <div className="flex gap-3 p-4 bg-brand-50 rounded-2xl border-brand-100">
        <Calendar className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          Only one term can be <strong>Active</strong> at a time. Active terms are shown to all teachers and students.
          <br />Use <strong>Upcoming</strong> for future terms and <strong>Inactive</strong> for past ones.
        </p>
      </div>

      <div className="card overflow-hidden animate-fade-in-up">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : terms.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <Calendar className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No terms yet</p>
            <p className="text-xs mt-1">Click "Add Term" to create the first one</p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Term</th>
                <th>Status</th>
                <th>Dates</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t, i) => {
                const s = statusInfo(t.status);
                const isActive = t.status === 'ACTIVE';
                return (
                  <tr key={t.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <td>
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            <RefreshCw className="w-3 h-3" /> Active
                          </span>
                        )}
                        <span className="font-semibold text-slate-800">{t.label}</span>
                        <span className="text-xs text-slate-400">{t.yearLabel || ''}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="text-sm text-slate-600">
                      {t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      <span className="text-slate-300 mx-1">→</span>
                      {t.endDate ? new Date(t.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="text-right">
                      {isActive ? (
                        <span className="text-xs text-slate-300">Current term</span>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => handleSetActive(t)}>
                            Activate
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" loading={removing === t.id} onClick={() => handleDelete(t)}
                            className="text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? 'Edit Term' : 'Add Term'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Academic Year *</label>
            <select className="input" value={form.academicYearId}
              onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
              required>
              <option value="">Select academic year…</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
            {academicYears.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No academic years yet — create one first using "New Academic Year".</p>
            )}
          </div>
          <div>
            <label className="label">Term Label *</label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Term 1" required />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start Date</label>
              <input type="date" className="input" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> End Date</label>
              <input type="date" className="input" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              {editing ? 'Update' : 'Create'} Term
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddYear} onClose={() => setShowAddYear(false)} title="New Academic Year" size="sm">
        <form onSubmit={handleSaveYear} className="space-y-4">
          <div>
            <label className="label">Year Label *</label>
            <Input
              value={yearLabel}
              onChange={(e) => setYearLabel(e.target.value)}
              placeholder="e.g. 2026/2027"
              required
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">This groups terms together. You can add terms to it after creating it.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={savingYear} className="flex-1">Create Year</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddYear(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
