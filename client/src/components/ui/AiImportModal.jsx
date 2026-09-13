import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { importApi } from '../../api/import';
import Modal from './Modal';
import Button from './Button';
import { Upload, FileSpreadsheet, FileText, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';

const ACCEPTED_FILE = /\.(csv|xlsx|xls|pdf|txt)$/i;
const MAX_BYTES = 10 * 1024 * 1024;

/** Trims names and drops rows too short to pass the server's min(2) rule. */
function cleanStudents(students) {
  return students
    .map((s) => ({ ...s, fullName: (s.fullName || '').trim() }))
    .filter((s) => s.fullName.length >= 2);
}

/**
 * Upload a document (Excel / CSV / PDF) and let the AI service pull out the
 * students. Shows a preview the user can edit before committing.
 *
 * @param {boolean}  isOpen
 * @param {() => void} onClose
 * @param {() => void} onImported  called after a successful commit (refresh list)
 */
export default function AiImportModal({ isOpen, onClose, onImported }) {
  const [file, setFile]       = useState(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null); // { students, classes, source }
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setParsing(false);
    setImporting(false);
    setDragging(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function pick(f) {
    if (!f) return;
    if (!ACCEPTED_FILE.test(f.name)) { toast.error('Use a CSV, Excel, PDF or text file'); return; }
    if (f.size > MAX_BYTES) { toast.error('File must be under 10 MB'); return; }
    setFile(f);
    setPreview(null);
  }

  /** Wraps pick() so re-selecting the same file still fires onChange. */
  function handleFileInput(e) {
    pick(e.target.files?.[0]);
    e.target.value = '';
  }

  async function parse() {
    if (!file) { toast.error('Choose a file first'); return; }
    setParsing(true);
    try {
      const fileData = await readAsDataURL(file);
      const res = await importApi.preview({ fileData, fileName: file.name });
      if (!res.data.students?.length) {
        toast.error('No students could be read from that file');
        setParsing(false);
        return;
      }
      setPreview(res.data);
      toast.success(`Found ${res.data.students.length} student${res.data.students.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not read the document');
    } finally { setParsing(false); }
  }

  function updateRow(idx, field, value) {
    setPreview((p) => {
      const students = p.students.slice();
      students[idx] = { ...students[idx], [field]: value };
      return { ...p, students };
    });
  }

  function removeRow(idx) {
    setPreview((p) => ({ ...p, students: p.students.filter((_, i) => i !== idx) }));
  }

  async function commit() {
    if (!preview?.students?.length) return;
    const students = cleanStudents(preview.students);
    if (!students.length) {
      toast.error("Every row needs a name of at least 2 characters");
      return;
    }
    setImporting(true);
    try {
      const payload = students.map((s) => ({
        fullName: s.fullName,
        admissionNumber: s.admissionNumber || null,
        gender: s.gender || null,
        dateOfBirth: s.dateOfBirth || null,
        classId: s.classId || null,
      }));
      const res = await importApi.commit({ students: payload });
      const { created = [], skipped = [] } = res.data || {};
      const createdCount = res.data?.createdCount ?? created.length;
      const skippedCount = res.data?.skippedCount ?? skipped.length;
      toast.success(`Imported ${createdCount} student${createdCount !== 1 ? 's' : ''}` +
        (skippedCount ? ` · ${skippedCount} skipped` : ''));
      if (createdCount) onImported?.();

      // If some rows failed, keep the modal open with only those rows so the
      // user can fix them — and so a retry can't re-submit duplicates.
      if (skippedCount) {
        const doneNames = new Set(created.map((c) => (c.fullName || '').trim().toLowerCase()));
        const remaining = students.filter((s) => !doneNames.has(s.fullName.toLowerCase()));
        if (remaining.length) {
          setPreview((p) => ({ ...p, students: remaining }));
          const first = skipped[0]?.reason ? ` (${skipped[0].reason})` : '';
          toast.error(`${skippedCount} row${skippedCount !== 1 ? 's' : ''} could not be saved${first}`);
          return;
        }
      }
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Students with AI" size="lg">
      {!preview ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Upload an existing class list — Excel (.xlsx), CSV, PDF or text. The system reads the
            student names (and class / gender / scores if present) automatically.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
              ${dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}`}
          >
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.txt" className="hidden"
              onChange={handleFileInput}
            />
            <Upload className="w-10 h-10 mx-auto text-brand-500 mb-3" />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-slate-700 font-medium">
                <FileIcon name={file.name} /> {file.name}
              </div>
            ) : (
              <>
                <div className="text-slate-700 font-semibold">Click to choose a file, or drag it here</div>
                <div className="text-xs text-slate-400 mt-1">CSV · XLSX · PDF · TXT (max 10 MB)</div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" loading={parsing} onClick={parse} disabled={!file}>
              <Sparkles className="w-4 h-4" /> Analyse with AI
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold text-xs">
              <Sparkles className="w-3 h-3" /> {preview.source === 'ai' ? 'AI parsed' : 'Auto parsed'}
            </span>
            <span className="text-slate-500">
              {preview.students.length} student{preview.students.length !== 1 ? 's' : ''} found
            </span>
            {preview.truncated && <span className="text-amber-600 text-xs">· first 500 rows shown</span>}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Student ID</th>
                    <th className="px-3 py-2 font-medium">Class</th>
                    <th className="px-3 py-2 font-medium">Gender</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {preview.students.map((s, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">
                        <input className="input py-1 text-sm" value={s.fullName}
                          onChange={(e) => updateRow(i, 'fullName', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input py-1 text-sm" value={s.admissionNumber || ''}
                          placeholder="auto"
                          onChange={(e) => updateRow(i, 'admissionNumber', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <select className="input py-1 text-sm" value={s.classId || ''}
                          onChange={(e) => updateRow(i, 'classId', e.target.value || null)}>
                          <option value="">{s.className ? `Unmatched: ${s.className}` : '—'}</option>
                          {(preview.classes || []).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input py-1 text-sm" value={s.gender || ''}
                          onChange={(e) => updateRow(i, 'gender', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button type="button" aria-label={`Remove ${s.fullName || 'row'}`}
                          className="text-slate-400 hover:text-red-500" onClick={() => removeRow(i)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Review and edit before importing. Nothing is saved until you click Import.
          </p>

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="secondary" onClick={() => setPreview(null)}>Back</Button>
            <Button variant="primary" loading={importing} onClick={commit}
              disabled={!cleanStudents(preview.students).length}>
              Import {cleanStudents(preview.students).length} Student{cleanStudents(preview.students).length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function FileIcon({ name }) {
  if (/\.pdf$/i.test(name)) return <FileText className="w-5 h-5 text-red-500" />;
  return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
