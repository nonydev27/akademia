import api from './axiosClient';

export const gradesApi = {
  // ── Grade Sheet (bulk Excel-like) ─────────────────────────────────────────
  // Load all students + existing grades for a class/subject/term
  sheetLoad:    (classId, subjectId, termId) =>
    api.get(`/grades/sheet/${classId}/${subjectId}/${termId}`),

  // Save entire spreadsheet in one POST
  sheetSave:    (data)                       => api.post('/grades/sheet', data),

  // Finalize all grades for a class/subject/term (locks editing)
  sheetFinalize:(classId, subjectId, termId) =>
    api.post(`/grades/finalize/${classId}/${subjectId}/${termId}`),

  // ── Legacy single-record ──────────────────────────────────────────────────
  submitCa:    (data)              => api.post('/grades/ca', data),
  submitExam:  (data)              => api.post('/grades/exam', data),
  finalize:    (studentId, termId) => api.post(`/grades/finalize/${studentId}/${termId}`),
  classSheet:  (classId, termId)   => api.get(`/grades/class/${classId}/${termId}`),
};
