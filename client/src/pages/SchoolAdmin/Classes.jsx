import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { classesApi } from "../../api/classes";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
} from "lucide-react";

/**
 * Admin: manage classes. Each class has a human-facing Class ID (code),
 * e.g. "JHS2-A", which teachers pick from a dropdown — never a UUID.
 */
export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const [addForm, setAddForm] = useState({ name: "", code: "" });
  const [editForm, setEditForm] = useState({ name: "", code: "" });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classesApi.list();
      setClasses(res.data.classes);
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await classesApi.create({
        name: addForm.name,
        code: addForm.code || undefined,
      });
      toast.success("Class created");
      setShowAdd(false);
      setAddForm({ name: "", code: "" });
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create class");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!showEdit) return;
    setSaving(true);
    try {
      await classesApi.update(showEdit.id, editForm);
      toast.success("Class updated");
      setShowEdit(null);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update class");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(klass) {
    if (!window.confirm(`Delete "${klass.name}"? This cannot be undone.`))
      return;
    setRemoving(klass.id);
    try {
      await classesApi.remove(klass.id);
      toast.success("Class deleted");
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete class");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">
            Create classes and give each a Class ID teachers can pick from a
            list
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Class
        </Button>
      </div>

      <div className="flex gap-3 p-4 bg-brand-50 rounded-2xl border-brand-100">
        <GraduationCap className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          Each class has a human-friendly <strong>Class ID</strong> (e.g.{" "}
          <code className="text-xs">JHS2-A</code>). Teachers and admins select
          classes from a dropdown everywhere in the app, so no one ever types a
          UUID.
        </p>
      </div>

      <div className="card overflow-hidden animate-fade-in-up">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <Layers className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No classes yet</p>
            <p className="text-xs mt-1">
              Click "Add Class" to create the first one
            </p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Class</th>
                <th>Class ID</th>
                <th>Students</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => (
                <tr key={c.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold">
                      {c.code}
                    </code>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {c._count?.enrollments ?? 0}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowEdit(c);
                          setEditForm({ name: c.name, code: c.code });
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        loading={removing === c.id}
                        onClick={() => handleDelete(c)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
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

      {/* Add Modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Class"
        size="sm"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. JHS 2 A"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
          />
          <Input
            label="Class ID (optional)"
            placeholder="Auto from name, e.g. JHS-2-A"
            value={addForm.code}
            onChange={(e) =>
              setAddForm({ ...addForm, code: e.target.value.toUpperCase() })
            }
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="flex-1"
            >
              Create Class
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!showEdit}
        onClose={() => setShowEdit(null)}
        title="Edit Class"
        size="sm"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Class Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Class ID"
            value={editForm.code}
            onChange={(e) =>
              setEditForm({ ...editForm, code: e.target.value.toUpperCase() })
            }
            required
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEdit(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
