// One-off: give a clearer error when a valid Supabase user has no Akademia profile.
const fs = require("fs");
const p = "src/middleware/auth.middleware.js";
let s = fs.readFileSync(p, "utf8");

const oldLine = "  if (!profile) throw ApiError.unauthorized();";
const newBlock = [
  "  if (!profile) {",
  "    // The Supabase login is valid but this account has no Akademia profile.",
  "    // Return an actionable message instead of a bare 401.",
  "    throw ApiError.unauthorized(",
  "      'This account has no Akademia profile. Ask your administrator to register you, or contact support.'",
  "    );",
  "  }",
].join("\n");

if (s.includes(oldLine)) {
  s = s.replace(oldLine, newBlock);
  fs.writeFileSync(p, s);
  console.log("patched auth.middleware.js");
} else {
  console.log("target line not found (already patched?)");
}
