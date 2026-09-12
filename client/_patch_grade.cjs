// Patch Staff/GradeEntry.jsx to:
//  - load the teacher's own assignments (classes + subjects by code)
//  - replace the "Paste Class UUID" box with a class dropdown
//  - keep the subject code + PIN gate as the identity check
const fs = require("fs");
const p = "src/pages/Staff/GradeEntry.jsx";
let s = fs.readFileSync(p, "utf8");
const before = s;

// 1) import staffApi + classesApi are not needed; use staffApi.mine()
s = s.replace(
  "import { gradesApi }   from '../../api/grades';",
  "import { gradesApi }   from '../../api/grades';\nimport { staffApi }    from '../../api/staff';",
);

fs.writeFileSync(p, s);
console.log(s === before ? "NO CHANGE" : "patched imports");
