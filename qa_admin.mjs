export default async function run(page, ui) {
  const out = { errors: [], consoleMsgs: [], failedReqs: [] };

  page.on("pageerror", (e) =>
    out.errors.push(String(e && e.stack ? e.stack : e).slice(0, 800)),
  );
  page.on("console", (m) => {
    if (m.type() === "error") out.consoleMsgs.push(m.text().slice(0, 800));
  });
  page.on("requestfailed", (r) =>
    out.failedReqs.push(r.url() + " :: " + (r.failure()?.errorText || "")),
  );

  // Login
  await page.getByPlaceholder("you@school.edu").fill("admin@demoschool.app");
  await page.getByPlaceholder("\u2022\u2022").fill("Admin123!");
  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForTimeout(6000);

  out.url = page.url();
  out.rootHtml = await page.evaluate(() => {
    const r = document.getElementById("root");
    return r ? r.innerHTML.slice(0, 500) : "NO #root";
  });
  out.rootLen = await page.evaluate(
    () => (document.getElementById("root")?.innerHTML || "").length,
  );

  return out;
}
