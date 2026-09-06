// Reusable animated status badge

const STATUS_MAP = {
  ACTIVE:          { cls: 'badge-active',   label: 'Active',         dot: true },
  EXPIRED_IN_GRACE:{ cls: 'badge-expired',  label: 'Grace Period',   dot: false },
  EXPIRED_LOCKED:  { cls: 'badge-locked',   label: 'Locked',         dot: false },
  RELEASED:        { cls: 'badge-released', label: 'Released',       dot: false },
  WITHHELD:        { cls: 'badge-withheld', label: 'Withheld',       dot: false },
  PAID:            { cls: 'badge-paid',     label: 'Paid',           dot: true },
  DUE:             { cls: 'badge-due',      label: 'Due',            dot: false },
  PRESENT:         { cls: 'badge-present',  label: 'Present',        dot: false },
  ABSENT:          { cls: 'badge-absent',   label: 'Absent',         dot: false },
  TARDY:           { cls: 'badge-tardy',    label: 'Tardy',          dot: false },
  SENT:            { cls: 'badge-sent',     label: 'Sent',           dot: false },
  FAILED:          { cls: 'badge-failed',   label: 'Failed',         dot: false },
  STAFF:           { cls: 'badge bg-slate-100 text-slate-600', label: 'Staff',   dot: false },
  SCHOOL_ADMIN:    { cls: 'badge bg-blue-100 text-blue-700',   label: 'Admin',   dot: false },
  SUPER_ADMIN:     { cls: 'badge bg-purple-100 text-purple-700', label: 'Super Admin', dot: false },
  PRIMARY:         { cls: 'badge bg-teal-100 text-teal-700',   label: 'Primary', dot: false },
  JHS:             { cls: 'badge bg-cyan-100 text-cyan-700',   label: 'JHS',     dot: false },
  SHS:             { cls: 'badge bg-indigo-100 text-indigo-700',label: 'SHS',    dot: false },
  EMAIL:           { cls: 'badge bg-blue-100 text-blue-700',   label: 'Email',   dot: false },
  SMS:             { cls: 'badge bg-green-100 text-green-700', label: 'SMS',     dot: false },
};

export default function StatusBadge({ status, label: labelOverride }) {
  const config = STATUS_MAP[status] || {
    cls: 'badge bg-slate-100 text-slate-600',
    label: status || '—',
    dot: false,
  };
  const label = labelOverride || config.label;

  return (
    <span className={`${config.cls} animate-fade-in`}>
      {config.dot && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-ping-slow" />
      )}
      {label}
    </span>
  );
}
