import { Check, Sparkles } from "lucide-react";
import { PLAN_LIST, FEATURE_LABELS } from "../../config/plans";

/**
 * Selectable plan cards. Used by the Super Admin when creating a school and
 * when changing a school's plan.
 */
export default function PlanPicker({ value, onChange }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {PLAN_LIST.map((plan) => {
        const active = value === plan.id;
        const enabled = Object.entries(plan.features)
          .filter(([, v]) => v)
          .map(([k]) => k);
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange?.(plan.id)}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200
              ${
                active
                  ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50"
              }`}
          >
            {plan.id === "PREMIUM" && (
              <span
                className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold
                               text-accent-700 bg-accent-100 px-2 py-0.5 rounded-full uppercase"
              >
                <Sparkles className="w-3 h-3" /> Best
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${active ? "border-brand-600 bg-brand-600" : "border-slate-300"}`}
              >
                {active && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="font-bold text-slate-800">{plan.name}</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              GHS {plan.priceGHS.toLocaleString()}
              <span className="text-xs font-medium text-slate-400"> /year</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 mb-2">{plan.tagline}</p>
            <ul className="space-y-0.5">
              {enabled.map((k) => (
                <li
                  key={k}
                  className="text-xs text-slate-600 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-emerald-500" />{" "}
                  {FEATURE_LABELS[k] || k}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
