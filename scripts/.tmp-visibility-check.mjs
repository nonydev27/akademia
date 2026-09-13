/**
 * Verifies the Tailwind `group` / `group-hover` contract used by the student
 * edit pencils, without needing a logged-in session.
 *
 * The bug was: `opacity-0 group-hover:opacity-100` on the pencil, with no
 * ancestor carrying the `group` class. Tailwind compiles group-hover to
 * `.group:hover .group-hover\:opacity-100`. If no ancestor has `group`, the
 * selector can never match and the element is invisible forever.
 *
 * This builds both DOM shapes and asks the real compiled stylesheet what
 * computed opacity each one produces.
 */
export default async function run(page, ui) {
  await page.setContent(`
    <div id="broken" class="menu">
      <div class="row flex items-center gap-2 py-1">
        <span>Full Name</span>
        <button id="brokenbtn" class="pencil opacity-0 group-hover:opacity-100 transition">edit</button>
      </div>
    </div>
    <div id="fixed" class="menu">
      <div class="row group flex items-center gap-2 py-1">
        <span>Full Name</span>
        <button id="fixedbtn" class="pencil opacity-0 group-hover:opacity-100 transition">edit</button>
      </div>
    </div>
  `);

  // Inject the same Tailwind the app is built with, so the utility classes used
  // above are actually defined.
  await page.addScriptTag({ url: "https://cdn.tailwindcss.com" });
  await page.waitForTimeout(1200);

  const read = async (id) =>
    page.evaluate((elId) => {
      const el = document.getElementById(elId);
      return getComputedStyle(el).opacity;
    }, id);

  // Resting state, before any hover.
  const brokenResting = await read("brokenbtn");
  const fixedResting = await read("fixedbtn");

  // Hover the row. In the broken markup the row is not a hover group, so the
  // pencil must stay at 0; in the fixed markup the row IS the group.
  await page.hover("#broken .row");
  await page.waitForTimeout(300);
  const brokenHovered = await read("brokenbtn");

  await page.hover("#fixed .row");
  await page.waitForTimeout(300);
  const fixedHovered = await read("fixedbtn");

  return {
    brokenResting,
    brokenHovered,
    fixedResting,
    fixedHovered,
    verdict: {
      brokenRowNeverReveals: brokenHovered === "0",
      fixedRowRevealsOnHover: fixedHovered === "1",
    },
  };
}
