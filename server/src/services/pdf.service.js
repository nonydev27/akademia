/**
 * services/pdf.service.js — generates the report card PDF (PRD 5.4).
 *
 * Pure with respect to the database: receives already-fetched data, returns
 * a Buffer.
 */

import PDFDocument from 'pdfkit';
import { letterGrade } from './grade.service.js';

export function generateReportCardPdf({ tenantName, student, term, grades, attendanceSummary }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(tenantName || 'Akademia School', { align: 'center' });
    doc.fontSize(12).text('Student Report Card', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Student: ${student.fullName}`);
    doc.text(`Admission No: ${student.admissionNumber}`);
    doc.text(`Term: ${term.label}`);
    doc.moveDown();

    doc.fontSize(13).text('Subjects', { underline: true });
    doc.moveDown(0.5);

    const colX = { subject: 50, ca: 260, exam: 340, aggregate: 420, grade: 490 };
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Subject', colX.subject, doc.y, { continued: false });
    doc.text('CA', colX.ca, doc.y - 12);
    doc.text('Exam', colX.exam, doc.y - 12);
    doc.text('Aggregate', colX.aggregate, doc.y - 12);
    doc.text('Grade', colX.grade, doc.y - 12);
    doc.font('Helvetica');
    doc.moveDown(0.5);

    for (const g of grades) {
      const y = doc.y;
      doc.text(g.subjectName, colX.subject, y);
      doc.text(g.caScore != null ? String(g.caScore) : '-', colX.ca, y);
      doc.text(g.examScore != null ? String(g.examScore) : '-', colX.exam, y);
      doc.text(g.aggregate != null ? String(g.aggregate) : '-', colX.aggregate, y);
      doc.text(letterGrade(g.aggregate) || '-', colX.grade, y);
      doc.moveDown();
    }

    doc.moveDown();
    doc.fontSize(13).text('Attendance', { underline: true });
    doc.fontSize(11).text(
      `Present: ${attendanceSummary.present} / ${attendanceSummary.total} days (${attendanceSummary.percentage}%)`
    );

    doc.moveDown(2);
    doc.fontSize(9).fillColor('gray').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'right' });

    doc.end();
  });
}
