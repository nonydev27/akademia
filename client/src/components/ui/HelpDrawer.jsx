import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const HELP_SECTIONS = {
  SUPER_ADMIN: [
    {
      id: 'overview', icon: '🏛️', title: 'Platform Overview',
      content: `As Super Admin you manage the entire Akademia platform. You can see all schools, manage their subscriptions, and create new school accounts. You never interact with a school's students or grades directly — that boundary is enforced by the system.`,
    },
    {
      id: 'add-school', icon: '🏫', title: 'Adding a New School',
      content: `Go to Schools → click "Add School". Fill in the school name, level (Primary / JHS / SHS), and the first School Admin's details. The admin will receive login credentials at their email. Once created, the school starts with a 1-year active subscription.`,
    },
    {
      id: 'subscriptions', icon: '🔑', title: 'Managing Subscriptions',
      content: `Click any school name to open its detail page. From there you can change the subscription status (Active / Grace Period / Locked) and update the expiry date. Locked schools cannot log in until renewed. Data is preserved even when locked.`,
    },
  ],

  SCHOOL_ADMIN: [
    {
      id: 'overview', icon: '📊', title: 'Your Dashboard',
      content: `The dashboard shows a live summary: total students, outstanding fees, and your subscription status. Use the Quick Actions row to jump straight to the most common tasks. A warning banner appears automatically if your subscription is in the grace period.`,
    },
    {
      id: 'students', icon: '👨‍🎓', title: 'Managing Students',
      content: `Go to Students to add, search, and view all student records. Click any row to open the student's profile panel — you can see their class, fee balance, and linked guardians. Use "Add Guardian" inside the panel to attach a parent's contact for result notifications.`,
    },
    {
      id: 'teachers', icon: '👩‍🏫', title: 'Adding Teachers & Permissions',
      content: `Go to Staff Management to add teacher accounts. Each teacher gets their own login. After adding a teacher, use the "Assign" tab to give them permission for a specific Class + Subject. A teacher can only enter grades for their assigned combinations — they cannot change another teacher's work.`,
    },
    {
      id: 'grades', icon: '📝', title: 'Grade Sheet',
      content: `The Grade Sheet is an online spreadsheet. Select a class, subject, and term, then click Load. Every enrolled student appears as a row with three score columns: CA (30%), Midterm (20%), and End-of-Term Exam (50%). The aggregate and letter grade calculate live as you type. Click Save All when done. Finalize locks the sheet permanently.`,
    },
    {
      id: 'fees', icon: '💰', title: 'Fee Management',
      content: `Use the Fees page to set up term fee structures, record payments, and view outstanding balances. Each payment needs a unique reference number (e.g. mobile money transaction ID). To remove a fee lock for a student, use the Override tab — this requires a written reason and is fully audited.`,
    },
    {
      id: 'results', icon: '📋', title: 'Publishing Results',
      content: `Publishing triggers the Result-Fee Intercept: if a student's balance is GHS 0, the report card is released and sent by email + SMS. If there's an outstanding balance, the report is withheld and a payment demand is sent instead. You can publish one student at a time or use Publish All. A released result cannot be un-released without an override.`,
    },
    {
      id: 'subscription', icon: '🔑', title: 'Renewing Your Subscription',
      content: `When your annual subscription expires, you enter a 14-day grace period — everything still works, but a warning banner appears. After grace ends, the system locks operational screens. To renew, go to Subscription → enter your billing email → pay GHS 500 via Paystack. After checkout, paste your reference into the Verify box to activate instantly.`,
    },
  ],

  STAFF: [
    {
      id: 'overview', icon: '📚', title: 'Your Role',
      content: `As a teacher you can mark attendance and enter grades for the classes and subjects you have been assigned to. You cannot access fee information, publish results, or see another teacher's work. If you need access to a class or subject, ask your School Admin to assign you.`,
    },
    {
      id: 'attendance', icon: '✅', title: 'Marking Attendance',
      content: `Go to Mark Attendance. Select your class and the date (defaults to today), then click Load Roster. For each student, press P (Present), A (Absent), or T (Tardy) on your keyboard — the cursor automatically moves to the next student. Or click the P/A/T buttons directly. Press Save when done. You can re-open any date to correct a mark.`,
    },
    {
      id: 'grades', icon: '📝', title: 'Entering Grades',
      content: `Go to Grade Entry and select your class, subject, and term, then click Load Sheet. You'll see every enrolled student in a spreadsheet. Fill in CA Score (class tests/homework), Midterm Score, and End-of-Term Exam Score. The aggregate (weighted total) and letter grade calculate automatically. Click Save All to submit. Finalize locks the sheet — only do this when you're certain all scores are correct, because finalized grades cannot be changed.`,
    },
    {
      id: 'formula', icon: '🧮', title: 'Grade Formula',
      content: `Aggregate = (CA × 30%) + (Midterm × 20%) + (Exam × 50%). All scores are out of 100. Letter grades: A = 80–100, B = 70–79, C = 60–69, D = 50–59, E = 40–49, F = below 40. You can save partial scores — the aggregate shown is proportional until all three scores are entered.`,
    },
  ],
};

export default function HelpDrawer({ isOpen, onClose }) {
  const { user }         = useAuth();
  const sections         = HELP_SECTIONS[user?.role] || HELP_SECTIONS.STAFF;
  const [active, setActive] = useState(sections[0]?.id);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const activeSection = sections.find((s) => s.id === active) || sections[0];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl
                    flex flex-col transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
                        bg-gradient-to-r from-brand-800 to-brand-900 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="font-extrabold text-lg leading-none">Help & Guide</h2>
              <p className="text-brand-200 text-xs mt-0.5">Akademia User Manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Topic list */}
          <nav className="w-40 flex-shrink-0 border-r border-slate-100 py-4 overflow-y-auto bg-slate-50">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full text-left px-4 py-3 text-xs font-semibold flex flex-col gap-1
                            transition-all duration-150
                            ${active === s.id
                              ? 'bg-brand-50 text-brand-800 border-r-2 border-brand-600'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
              >
                <span className="text-base">{s.icon}</span>
                {s.title}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeSection && (
              <div className="animate-fade-in-up" key={activeSection.id}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{activeSection.icon}</span>
                  <h3 className="text-lg font-bold text-slate-900">{activeSection.title}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {activeSection.content}
                </p>

                {/* Grade formula visual for staff */}
                {activeSection.id === 'formula' && (
                  <div className="mt-5 space-y-2">
                    {[
                      { label: 'CA Score',          pct: '30%', color: 'bg-brand-500',   w: 'w-[30%]' },
                      { label: 'Midterm Score',      pct: '20%', color: 'bg-indigo-500',  w: 'w-[20%]' },
                      { label: 'End-of-Term Exam',   pct: '50%', color: 'bg-accent-500',  w: 'w-[50%]' },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{b.label}</span><span className="font-bold">{b.pct}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${b.color} ${b.w} rounded-full animate-fade-in`} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-mono">
                      Aggregate = (CA×0.30) + (Midterm×0.20) + (Exam×0.50)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            Akademia v1.0 · {user?.role?.replace('_', ' ')} Guide
          </p>
        </div>
      </aside>
    </>
  );
}
