/**
 * updater.js — Tauri auto-updater integration.
 *
 * The desktop build ships its UI inside the installer, so React changes only
 * reach users through a new signed release. This module downloads and installs
 * that release in the background, then tells the caller to relaunch.
 *
 * Outside the Tauri webview (plain browser / `npm run dev` in the browser) the
 * plugin is unavailable, so every export degrades to a no-op rather than
 * throwing.
 */

import toast from "react-hot-toast";

// The updater plugin only exists inside the Tauri webview. `isTauri` is set by
// Tauri v2 on `window`, and is absent in a normal browser tab.
export const isDesktopApp =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// Only auto-install updates we can actually swap in one shot. `installMode:
// "passive"` (see tauri.conf.json) shows the NSIS progress UI and relaunches
// without prompting, so the user is never left mid-update wondering.
const DEFAULT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let _checking = false;

/**
 * Ask the endpoint whether a newer signed release exists, and if so download,
 * verify, and stage it.
 *
 * @param {{ silent?: boolean }} [opts] `silent: true` suppresses the
 *   "up to date" toast — used for the periodic background check, so users
 *   aren't interrupted every few hours with good news.
 * @returns {Promise<{ status: 'updated'|'current'|'unsupported'|'error', version?: string, error?: Error }>}
 */
export async function checkForUpdate({ silent = false } = {}) {
  if (!isDesktopApp) return { status: "unsupported" };

  // Guard against overlapping runs (startup check + interval firing together).
  if (_checking) return { status: "current" };
  _checking = true;

  try {
    // Imported lazily so the browser bundle never pulls in the plugin.
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();

    if (!update) {
      if (!silent) toast.success("You are on the latest version.");
      return { status: "current" };
    }

    const toastId = toast.loading(`Downloading update ${update.version}…`);
    try {
      await update.downloadAndInstall();
      toast.success(`Update ${update.version} installed. Restarting…`, {
        id: toastId,
        duration: 3000,
      });

      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
      return { status: "updated", version: update.version };
    } catch (installErr) {
      toast.error("Update failed to install. Please restart the app.", {
        id: toastId,
      });
      throw installErr;
    }
  } catch (error) {
    // An update check must never break the app. A offline laptop, an expired
    // signing key, or a missing latest.json should all land here quietly.
    if (!silent) toast.error("Could not check for updates.");
    return { status: "error", error };
  } finally {
    _checking = false;
  }
}

/**
 * Run a check now and then on an interval for the life of the session.
 *
 * @param {{ intervalMs?: number }} [opts]
 * @returns {() => void} cleanup function that clears the interval.
 */
export function startUpdateChecks({
  intervalMs = DEFAULT_CHECK_INTERVAL_MS,
} = {}) {
  if (!isDesktopApp) return () => {};

  // Silence the "you're up to date" path here — this runs unattended.
  checkForUpdate({ silent: true });

  const timer = setInterval(() => {
    checkForUpdate({ silent: true });
  }, intervalMs);

  return () => clearInterval(timer);
}
