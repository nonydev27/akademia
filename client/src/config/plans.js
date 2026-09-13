/**
 * client/src/config/plans.js — client-side mirror of the server plan catalogue.
 * Used for display + plan selection. The server remains the source of truth.
 */

export const PLANS = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceGHS: 2800,
    tagline: "Core student records and grading.",
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
    tagline: "Adds fees, email and AI record import.",
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
    tagline: "Everything, including attendance, terms and subjects.",
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

export const FEATURE_LABELS = {
  students: "Student Records",
  grades: "Grades & Report Cards",
  fees: "Fee Management",
  email: "Email Notifications",
  attendance: "Attendance Tracking",
  terms: "Term Management",
  subjects: "Subject Management",
  aiImport: "AI Record Import",
};

export function planById(id) {
  return PLANS[id] || PLANS.BASIC;
}

/** Which plan best fits a feature map (used when the stored plan is unknown). */
export function detectPlan(features = {}) {
  const fit = (plan) =>
    Object.keys(PLANS[plan].features).every(
      (k) => !!features[k] === !!PLANS[plan].features[k],
    );
  if (fit("PREMIUM")) return "PREMIUM";
  if (fit("STANDARD")) return "STANDARD";
  return "BASIC";
}
