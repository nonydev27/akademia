import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { subjectsApi } from '../../api/subjects';
import Modal  from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';
import {
  BookOpen, Plus, Pencil, Trash2, KeyRound, ShieldCheck, ShieldOff,
} from 'lucide-react';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [showAdd,  setShowAdd]  = useState(false);
  const [showEdit, setShowEdit] = useState(null);   // subject object
  const [showPin,  setShowPin]  = useState(null);   // subject object
  const [saving,   setSaving]   = useState(false);
  const [removing, setRemoving] = useState(null);

  const [addForm,  setAddForm]  = useState({ name: '', code: '' });
  const [editForm, setEditForm] = useState({ name: '', code: '' });
  const [pin,      setPin]      = useState('');

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectsApi.list();
      setSubjects(res.data.subjects);
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await subjectsApi.create({ name: addForm.name, code: addForm.code.toUpperCase() });
      toast.success('Subject created');
      setShowAdd(false);
      setAddForm({ name: '', code: '' });
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject');
    } finally { setSaving(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!showEdit) return;
    setSaving(true);
    try {
      await subjectsApi.update(showEdit.id, editForm);
      toast.success('Subject updated');
      setShowEdit(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update subject');
    } finally { setSaving(false); }
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Delete "${subject.name}"? This cannot be undone.`)) return;
    setRemoving(subject.id);
    try {
      await subjectsApi.remove(subject.id);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    } finally { setRemoving(null); }
  }

  async function handleSetPin(e) {
    e.preventDefault();
    if (!showPin) return;
    if (!/^\d{4}$/.test(pin)) { toast.error('PIN must be exactly 4 digits'); return; }
    setSaving(true);
    try {
      await subjectsApi.setPin(showPin.id, pin);
      toast.success('PIN updated — share it with the assigned teacher');
      setShowPin(null);
      setPin('');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set PIN');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">Manage subject codes and teacher access PINs</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-brand-50 rounded-2xl border border-brand-100">
        <KeyRound className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          Each subject has a unique <strong>code</strong> (e.g. ENGLP2) and a 4-digit <strong>PIN</strong>.
          Teachers enter the PIN before marking attendance or entering grades to verify their identity.
          Admins set the PIN here; teachers can reset it from their portal.
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in-up">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No subjects yet</p>
            <p className="text-xs mt-1">Click "Add Subject" to create the first one</p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>PIN Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, i) => (
                <tr key={s.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="font-semibold text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold">
                      {s.code}
                    </code>
                  </td>
                  <td>
                    {s.pinSet ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> PIN Set
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       bg-amber-100 text-amber-700 text-xs font-semibold">
                        <ShieldOff className="w-3.5 h-3.5" /> No PIN
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" variant="outline"
                        onClick={() => { setShowPin(s); setPin(''); }}>
                        <KeyRound className="w-3.5 h-3.5" />
                        {s.pinSet ? 'Reset PIN' : 'Set PIN'}
                      </Button>
                      <Button size="sm" variant="outline"
                        onClick={() => { setShowEdit(s); setEditForm({ name: s.name, code: s.code }); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline"
                        loading={removing === s.id}
                        onClick={() => handleDelete(s)}
                        className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Subject" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Subject Name" placeholder="e.g. English Language"
            value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required />
          <div>
            <Input label="Subject Code" placeholder="e.g. ENGL01"
              value={addForm.code} onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })} required />
            <p className="text-xs text-slate-400 mt-1">
              Uppercase letters and digits only. Must be unique per school.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">Create Subject</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Subject" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Subject Name" value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <Input label="Subject Code" value={editForm.code}
            onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} required />
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">Save Changes</Button>
            <Button type="button" variant="secondary" onClick={() => setShowEdit(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Set/Reset PIN Modal */}
      <Modal isOpen={!!showPin} onClose={() => { setShowPin(null); setPin(''); }}
             title={showPin?.pinSet ? 'Reset Subject PIN' : 'Set Subject PIN'} size="sm">
        <form onSubmit={handleSetPin} className="space-y-4">
          <p className="text-sm text-slate-600">
            Setting a PIN for <strong>{showPin?.name}</strong> ({showPin?.code}).
            The teacher assigned to this subject will enter this PIN to access grades and attendance.
          </p>
          <div>
            <label className="label">4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="input text-center text-2xl font-mono tracking-widest"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              <KeyRound className="w-4 h-4" /> Save PIN
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowPin(null); setPin(''); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
