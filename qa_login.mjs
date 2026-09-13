export default async function run(page, ui) {
  const snap = await ui.snapshot();
  const step = { snapshot: snap };

  try {
    await page.getByPlaceholder("you@school.edu").fill("admin@demoschool.app");
    await page.getByPlaceholder("\u2022\u2022").fill("Admin123!");
    step.filled = true;
  } catch (e) {
    step.fillError = String(e).slice(0, 300);
    return step;
  }

  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForTimeout(6000);

  step.url = page.url();
  step.bodyHtmlLen = await page.evaluate(() => document.body.innerHTML.length);
  step.bodyText = await page.evaluate(() =>
    document.body.innerText.slice(0, 800),
  );
  return step;
}
