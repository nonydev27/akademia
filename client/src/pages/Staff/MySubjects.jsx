import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { subjectsApi } from "../../api/subjects";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import {
  BookOpen,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
  Layers,
} from "lucide-react";

/**
 * Teacher portal: view the subjects you are assigned to, and set or reset the
 * access PIN for each. The PIN gates attendance marking and grade entry, and
 * keeps each subject teacher's work independent from other teachers'.
 */
export default function MySubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinFor, setPinFor] = useState(null); // subject being edited
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectsApi.mine();
      setSubjects(res.data.subjects);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load your subjects",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  function openPin(subject) {
    setPinFor(subject);
    setPin("");
    setConfirm("");
  }

  async function handleSavePin(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirm) {
      toast.error("PINs do not match");
      return;
    }
    setSaving(true);
    try {
      await subjectsApi.resetPin(pinFor.id, pin);
      toast.success(
        pinFor.pinSet ? "PIN reset successfully" : "PIN set successfully",
      );
      setPinFor(null);
      fetchMine();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update PIN");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Subjects</h1>
          <p className="page-subtitle">
            Set or reset the access PIN for the subjects you teach
          </p>
        </div>
        <Button variant="outline" onClick={fetchMine} loading={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Explainer */}
      <div className="flex gap-3 p-4 bg-brand-50 rounded-2xl border-brand-100">
        <KeyRound className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          Each subject has a unique <strong>code</strong> and a 4-digit{" "}
          <strong>PIN</strong>. Enter the code and PIN when marking attendance
          or entering grades. If you forget your PIN, reset it here — only
          subjects you are assigned to appear below.
        </p>
      </div>

      {/* List */}
      <div className="card overflow-hidden animate-fade-in-up">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              No subjects assigned to you yet
            </p>
            <p className="text-xs mt-1">
              Ask your School Admin to assign you to a Class and Subject
            </p>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Classes</th>
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
                      <span className="font-semibold text-slate-800">
                        {s.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold">
                      {s.code}
                    </code>
                  </td>
                  <td>
                    {s.classes?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {s.classes.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5
                                                     bg-slate-100 text-slate-600 text-xs rounded-lg font-medium"
                          >
                            <Layers className="w-3 h-3" /> {c.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td>
                    {s.pinSet ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       bg-emerald-100 text-emerald-700 text-xs font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> PIN Set
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                       bg-amber-100 text-amber-700 text-xs font-semibold"
                      >
                        <ShieldOff className="w-3.5 h-3.5" /> No PIN
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPin(s)}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {s.pinSet ? "Reset PIN" : "Set PIN"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Set / Reset PIN Modal */}
      <Modal
        isOpen={!!pinFor}
        onClose={() => setPinFor(null)}
        title={pinFor?.pinSet ? "Reset Subject PIN" : "Set Subject PIN"}
        size="sm"
      >
        <form onSubmit={handleSavePin} className="space-y-4">
          <p className="text-sm text-slate-500">
            {pinFor?.name}{" "}
            <code className="text-xs bg-slate-100 px-1 rounded font-mono">
              {pinFor?.code}
            </code>{" "}
            — choose a 4-digit PIN you will remember. You can reset it here any
            time.
          </p>

          <div>
            <label className="label">New 4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input text-center text-2xl font-mono tracking-widest"
              placeholder="••"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              required
            />
          </div>

          <div>
            <label className="label">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input text-center text-2xl font-mono tracking-widest"
              placeholder="••"
              value={confirm}
              onChange={(e) =>
                setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              className="flex-1"
            >
              <KeyRound className="w-4 h-4" /> Save PIN
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPinFor(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
