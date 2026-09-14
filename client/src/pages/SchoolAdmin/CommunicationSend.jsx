import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { communicationsApi } from '../../api/communications';
import { studentsApi } from '../../api/students';
import { subjectsApi } from '../../api/subjects';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Send, Mail, Smartphone, X, Users, CheckCircle2 } from 'lucide-react';

const CHANNELS = [
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  { value: 'SMS', label: 'SMS', icon: Smartphone, color: 'text-emerald-600 bg-emerald-50' },
];

const TEMPLATE_OPTIONS = [
  { value: 'GENERIC', label: 'Generic Message' },
  { value: 'FEE_REMINDER', label: 'Fee Reminder' },
  { value: 'RESULT_RELEASED', label: 'Result Released' },
  { value: 'SUBSCRIPTION_RENEWED', label: 'Subscription Renewed' },
  { value: 'TEACHER_WELCOME', label: 'Teacher Welcome' },
];

export default function CommunicationSend({ onSent, onClose }) {
  const [channel, setChannel] = useState('EMAIL');
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [templateKey, setTemplateKey] = useState('GENERIC');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recipientList, setRecipientList] = useState([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim().length < 2) { setSearchResults([]); return; }
      setSearching(true);
      studentsApi.list({ search, pageSize: 10 }).then((r) => {
        setSearchResults(r.data.students || []);
      }).catch(() => { setSearchResults([]); }).finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  function addRecipient(student) {
    if (recipientList.find((r) => r.email === student.email)) {
      toast.error('Already added');
      return;
    }
    if (channel === 'EMAIL' && !student.email) {
      toast.error('This student has no email');
      return;
    }
    setRecipientList((prev) => [...prev, student]);
    setSearch('');
    setSearchResults([]);
  }

  function removeRecipient(studentId) {
    setRecipientList((prev) => prev.filter((r) => r.id !== studentId));
  }

  function addManualRecipient() {
    const trimmed = recipients.trim();
    if (!trimmed) return;
    const emails = trimmed.split(/[,;\s]+/).filter(Boolean);
    setRecipientList((prev) => {
      const existing = new Set(prev.map((r) => r.email));
      const newOnes = emails.filter((e) => !existing.has(e)).map((email) => ({
        id: Math.random().toString(36).slice(2),
        fullName: email,
        email,
        admissionNumber: '',
      }));
      return [...prev, ...newOnes];
    });
    setRecipients('');
  }

  async function handleSend() {
    if (recipientList.length === 0) { toast.error('Add at least one recipient'); return; }
    if (channel === 'EMAIL' && !subject.trim()) { toast.error('Subject is required for email'); return; }

    setSending(true);
    try {
      await communicationsApi.send({
        channel,
        recipients: recipientList.map((r) => r.email),
        subject: subject.trim() || undefined,
        templateKey: templateKey !== 'GENERIC' ? templateKey : undefined,
        message: message.trim() || undefined,
        data: {
          message: message.trim(),
          recipients: recipientList.map((r) => r.fullName),
        },
      });
      setSent(true);
      toast.success(`Sent to ${recipientList.length} recipient${recipientList.length > 1 ? 's' : ''}`);
      onSent?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Send Communication" size="lg">
      {sent ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Communication Sent</h2>
          <p className="text-slate-500 mt-2">Message delivered to {recipientList.length} recipient{recipientList.length > 1 ? 's' : ''}</p>
          <Button variant="primary" onClick={onClose} className="mt-6">Done</Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Channel */}
          <div>
            <label className="label">Channel</label>
            <div className="flex gap-3">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { setChannel(c.value); setRecipientList([]); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                    ${channel === c.value ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <c.icon className={`w-4 h-4 ${c.color.split(' ')[0]}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="label">Recipients ({recipientList.length})</label>

            {/* Search students */}
            {channel === 'EMAIL' && (
              <div className="flex gap-2 mb-3">
                <input
                  className="input flex-1"
                  placeholder="Search students by name or admission number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="button" variant="secondary" loading={searching} className="px-4">Search</Button>
              </div>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 max-h-40 overflow-y-auto">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addRecipient(s)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium">{s.fullName}</span>
                    <span className="text-slate-400 ml-2">{s.admissionNumber}</span>
                    {s.email && <span className="text-xs text-slate-500 ml-2">{s.email}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Recipient list */}
            <div className="space-y-1.5 mb-3 min-h-[2rem]">
              {recipientList.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{r.fullName}</span>
                    <span className="text-xs text-slate-400 ml-2">{r.email}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeRecipient(r.id)} className="text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {recipientList.length === 0 && (
                <p className="text-xs text-slate-400 py-2">
                  {channel === 'EMAIL' ? 'Search and select students, or enter email addresses below' : 'Enter phone numbers (one per line)'}
                </p>
              )}
            </div>

            {/* Manual entry */}
            {channel === 'EMAIL' && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add email, comma or space separated…"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualRecipient(); } }}
                />
                <Button type="button" variant="outline" onClick={addManualRecipient} disabled={!recipients.trim()}>Add</Button>
              </div>
            )}
            {channel === 'SMS' && (
              <Input
                placeholder="Phone numbers, comma or newline separated (e.g. 0244123456, 0201234567)"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualRecipient(); } }}
              />
            )}
          </div>

          {/* Subject (email only) */}
          {channel === 'EMAIL' && (
            <Input
              label="Subject"
              placeholder="e.g. Important Announcement"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          )}

          {/* Template */}
          <div>
            <label className="label">Template</label>
            <select
              className="input"
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Write your message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
            />
            <p className="text-xs text-slate-400 mt-1">{message.length}/5000</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="primary" loading={sending} disabled={recipientList.length === 0} onClick={handleSend} className="flex-1">
              <Send className="w-4 h-4" /> Send to {recipientList.length}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
