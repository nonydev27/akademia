/**
 * services/storage.service.js — Supabase Storage for generated report card
 * PDFs, so a released report card can be re-downloaded without regenerating
 * the PDF on every request.
 */

import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Ensure the avatar bucket exists and is publicly readable. Supabase Storage
 * buckets are not created automatically, so without this an avatar upload
 * fails with "Bucket not found" — which is exactly why local uploads appeared
 * broken. Called once at boot; safe to run repeatedly.
 */
export async function ensureStorageBuckets() {
  const buckets = [
    { name: env.SUPABASE_AVATARS_BUCKET || 'avatars', isPublic: true },
    { name: env.SUPABASE_STORAGE_BUCKET || 'report-cards', isPublic: false },
  ];

  for (const { name, isPublic } of buckets) {
    if (!name) continue;
    try {
      const { data: list } = await supabaseAdmin.storage.listBuckets();
      const exists = (list || []).some((b) => b.name === name);
      if (!exists) {
        const { error } = await supabaseAdmin.storage.createBucket(name, { public: isPublic });
        if (error) logger.warn(`Could not create storage bucket "${name}": ${error.message}`);
        else logger.info(`Created storage bucket "${name}"`);
      } else if (isPublic) {
        await supabaseAdmin.storage.updateBucket(name, { public: true }).catch(() => {});
      }
    } catch (err) {
      logger.warn(`Storage bucket check failed for "${name}": ${err.message}`);
    }
  }
}

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
