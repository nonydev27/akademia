/**
 * config/plans.js — single source of truth for subscription plans.
 *
 * A plan maps to a set of feature flags. The Super Admin picks a plan when
 * creating a school (or later, from the tenant detail page); the plan's
 * features are then written onto the Subscription so the rest of the app can
 * gate behaviour on `features[key] === true`.
 */

export const FEATURE_KEYS = [
  "students",
  "grades",
  "fees",
  "email",
  "attendance",
  "terms",
  "subjects",
  "aiImport",
];

export const PLANS = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceGHS: 2800,
    tagline: "Core student records and grading for small schools.",
    features: {
      students: true,
      grades: true,
      fees: false,
      email: false,
      attendance: false,
      terms: false,
      subjects: false,
      aiImport: false,
    },
  },
  STANDARD: {
    id: "STANDARD",
    name: "Standard",
    priceGHS: 4800,
    tagline: "Adds fees, email notifications and AI-assisted record import.",
    features: {
      students: true,
      grades: true,
      fees: true,
      email: true,
      attendance: false,
      terms: false,
      subjects: false,
      aiImport: true,
    },
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    priceGHS: 8200,
    tagline: "Everything: attendance, terms, subjects and AI import.",
    features: {
      students: true,
      grades: true,
      fees: true,
      email: true,
      attendance: true,
      terms: true,
      subjects: true,
      aiImport: true,
    },
  },
};

export const PLAN_LIST = [PLANS.BASIC, PLANS.STANDARD, PLANS.PREMIUM];

export function isValidPlan(plan) {
  return Object.prototype.hasOwnProperty.call(PLANS, plan);
}

export function planFeatures(plan) {
  return { ...(PLANS[plan]?.features || PLANS.BASIC.features) };
}

export function planPrice(plan) {
  return PLANS[plan]?.priceGHS ?? PLANS.BASIC.priceGHS;
}

/**
 * Given a subscription, return the effective feature map. Prefers the stored
 * `features` JSON (which the Super Admin can hand-tune) but falls back to the
 * plan defaults when it is empty.
 */
export function effectiveFeatures(subscription) {
  const stored = subscription?.features;
  if (stored && typeof stored === "object" && Object.keys(stored).length > 0) {
    return { ...planFeatures(subscription.plan), ...stored };
  }
  return planFeatures(subscription?.plan || "BASIC");
}

/** Best-effort reverse mapping: which plan does this feature set look like? */
export function detectPlan(features = {}) {
  const fitted = (plan) => {
    const pf = PLANS[plan].features;
    return FEATURE_KEYS.every((k) => !!features[k] === !!pf[k]);
  };
  if (fitted("PREMIUM")) return "PREMIUM";
  if (fitted("STANDARD")) return "STANDARD";
  return "BASIC";
}
