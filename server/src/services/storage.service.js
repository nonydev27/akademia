/**
 * services/storage.service.js — Supabase Storage for generated report card
 * PDFs, so a released report card can be re-downloaded without regenerating
 * the PDF on every request.
 */

import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

function reportCardPath(tenantId, studentId, termId) {
  return `${tenantId}/${studentId}/${termId}.pdf`;
}

export async function uploadReportCard({ tenantId, studentId, termId, pdfBuffer }) {
  const path = reportCardPath(tenantId, studentId, termId);
  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw error;
  return path;
}

export async function downloadReportCard(path) {
  const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).download(path);
  if (error) return null;
  return Buffer.from(await data.arrayBuffer());
}
