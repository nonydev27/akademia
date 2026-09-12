import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Hand, LayoutDashboard, Users2, NotebookPen, ClipboardCheck, HelpCircle,
  CheckSquare, Calculator, Lock, School, KeyRound,
} from 'lucide-react';

const TOUR_KEY = 'akademia_tour_done_v1';

const STEPS = {
  SCHOOL_ADMIN: [
    {
      Icon: Hand,
      title: 'Welcome to Akademia!',
      body: "You're logged in as School Admin. This quick tour shows you where everything is. Click Next to continue, or Skip to jump straight in.",
    },
    {
      Icon: LayoutDashboard,
      title: 'Your Dashboard',
      body: 'The dashboard gives you a live overview of your school — students, outstanding fees, and subscription status. Quick-action buttons let you jump to the most common tasks instantly.',
    },
    {
      Icon: Users2,
      title: 'Add Teachers First',
      body: "Before teachers can enter grades, you need to add them under Staff Management and assign them to a Class + Subject. That's what controls who can edit which grade sheet.",
    },
    {
      Icon: NotebookPen,
      title: 'The Grade Sheet',
      body: 'The online grade sheet works like a spreadsheet. Load a class, subject, and term to see all enrolled students. Enter CA, Midterm, and Exam scores — the aggregate calculates live. Save All submits everything at once.',
    },
    {
      Icon: ClipboardCheck,
      title: 'Publishing Results',
      body: "When you're ready to release results, go to Publish Results. The system checks each student's fee balance automatically. Zero balance = report released + notification sent. Outstanding balance = report withheld + payment demand sent.",
    },
    {
      Icon: HelpCircle,
      title: 'Need Help Anytime?',
      body: 'Click the Help button in the top bar at any time to open the full user guide. You can also hover over any input or icon to see a tooltip explaining what it does.',
    },
  ],
  STAFF: [
    {
      Icon: Hand,
      title: 'Welcome, Teacher!',
      body: "You're logged in as a staff member. You can mark attendance and enter grades for your assigned classes. Let's get you oriented.",
    },
    {
      Icon: CheckSquare,
      title: 'Marking Attendance',
      body: 'Go to Mark Attendance, pick your class and date, then click Load Roster. Use keyboard shortcuts P (Present) and A (Absent) to mark quickly — the cursor moves down automatically.',
    },
    {
      Icon: NotebookPen,
      title: 'Entering Grades',
      body: "Go to Grade Entry, select your class, subject, and term. You'll only see classes and subjects your admin has assigned to you. Fill in CA, Midterm, and Exam scores for each student, then Save All.",
    },
    {
      Icon: Calculator,
      title: 'Grade Formula',
      body: 'Your aggregate is calculated as: CA (30%) + Midterm (20%) + End-of-Term Exam (50%). All out of 100. The letter grade and remark show live as you type.',
    },
    {
      Icon: Lock,
      title: 'Finalizing Grades',
      body: 'Once all scores are correct, click Finalize to lock the sheet. Finalized grades cannot be edited — not even by the admin. Only finalize when you are fully satisfied with every score.',
    },
  ],
  SUPER_ADMIN: [
    {
      Icon: Hand,
      title: 'Welcome, Super Admin!',
      body: 'You manage the entire Akademia platform. From here you can create school accounts, manage subscriptions, and monitor all tenants.',
    },
    {
      Icon: School,
      title: 'Adding Schools',
      body: "Click Add School on the dashboard. You'll set the school's name, level, and create the first admin account. The school gets a 1-year active subscription automatically.",
    },
    {
      Icon: KeyRound,
      title: 'Subscription Control',
      body: "Click any school to manage its subscription. You can activate, put in grace period, or lock a school. Locking preserves all data but prevents login until renewed.",
    },
  ],
};

export default function FirstTimeOverlay() {
  const { user }          = useAuth();
  const [step, setStep]   = useState(0);
  const [visible, setVisible] = useState(false);

  const steps = STEPS[user?.role] || [];

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(`${TOUR_KEY}_${user.id}`);
    if (!done && steps.length > 0) {
      // Short delay so the dashboard has time to render first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]); // eslint-disable-line

  function dismiss() {
    if (user) localStorage.setItem(`${TOUR_KEY}_${user.id}`, '1');
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else dismiss();
  }

  if (!visible || !steps.length) return null;

  const current = steps[step];
  const CurrentIcon = current.Icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-accent-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-brand-50
                       flex items-center justify-center animate-bounce-soft"
            key={step}
          >
            <CurrentIcon className="w-8 h-8 text-brand-600" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-3 animate-fade-in-up">
            {current.title}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed animate-fade-in-up"
             style={{ animationDelay: '80ms' }}>
            {current.body}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-300
                          ${i === step
                            ? 'w-6 h-2 bg-brand-600'
                            : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-8 pb-8">
          <button
            onClick={dismiss}
            className="text-slate-400 text-sm hover:text-slate-600 transition"
          >
            Skip tour
          </button>
          <div className="flex-1" />
          <button
            onClick={next}
            className="btn-primary btn px-6"
          >
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
