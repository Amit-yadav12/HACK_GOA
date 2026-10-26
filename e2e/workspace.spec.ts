import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { makePdf } from '../src/test/pdfFixture';

test('offer to proof workflow stays local and works on mobile', async ({ page }) => {
  const requests: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  await page.goto('/');
  await expect(page).toHaveTitle(/RoleWorth/);
  await page.getByRole('button', { name: 'Try the synthetic demo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A decision you can explain.' })).toBeVisible();
  await expect(page.getByText('Synthetic demo', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: /Offer & evidence/ }).first().click();
  await page.getByRole('button', { name: /Inspect source excerpt/ }).first().click();
  await expect(page.locator('blockquote').first()).toBeVisible();

  await page.getByRole('button', { name: /Decide/ }).first().click();
  await page.getByRole('button', { name: 'Edit personal priorities', exact: true }).click();
  await page.getByLabel('Hours available per week').fill('10');
  await page.getByRole('button', { name: 'Update my brief', exact: true }).click();
  await expect(page.getByText('Time exceeds your availability', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Clarify/ }).first().click();
  await page.getByRole('button', { name: /Insert a clearly labelled synthetic reply/ }).click();
  await page.getByRole('button', { name: 'Apply reply & view delta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What changed—and what didn’t.' })).toBeVisible();
  await expect(page.getByText('After recruiter reply', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: /Learn/ }).first().click();
  await page.locator('select[id^="status-"]').first().selectOption('completed');
  await page.getByRole('button', { name: 'Record outcome' }).first().click();
  await page.getByLabel('Work performed').fill('Built and reviewed one synthetic prototype.');
  await page.getByRole('button', { name: 'Save outcome', exact: true }).click();
  await expect(page.getByText('Outcome recorded', { exact: true }).first()).toBeVisible();

  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Compare offers' }).click();
  await page.getByRole('button', { name: 'Load synthetic second offer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Term-by-term comparison' })).toBeVisible();
  await expect(page.getByText('UX Research Intern', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Data & export', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Markdown', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.md$/);
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();

  const pdf = makePdf(['Organisation: Browser Test Studio', 'Role: Design Intern', 'Duration: 8 weeks', 'Working hours: 20 hours per week', 'Stipend: INR 18000 per month']);
  await page.getByRole('button', { name: 'New offer', exact: true }).click();
  await page.getByRole('tab', { name: 'Read a PDF', exact: true }).click();
  await page.locator('#offer-pdf').setInputFiles({ name: 'browser-offer.pdf', mimeType: 'application/pdf', buffer: Buffer.from(pdf) });
  await expect(page.getByText(/Extracted 1 page locally/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('textbox', { name: 'Offer text', exact: true })).toHaveValue(/Browser Test Studio/);
  await page.getByRole('button', { name: 'Build my evidence ledger', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A decision you can explain.' })).toBeVisible();
  await expect(page.getByText('Browser Test Studio', { exact: true }).first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('button', { name: 'Compare offers' }).first()).toBeVisible();

  const appOrigin = new URL(page.url()).origin;
  const externalRequests = requests.filter((url) => /^https?:/.test(url) && !url.startsWith(appOrigin));
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('priority dialog supports Escape and returns to the workspace', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the synthetic demo', exact: true }).click();
  const editPriorities = page.getByRole('button', { name: 'Edit personal priorities', exact: true });
  await editPriorities.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(editPriorities).toBeFocused();
  await expect(page.getByRole('heading', { name: 'A decision you can explain.' })).toBeVisible();
});

test('tablet navigation and mobile data controls remain reachable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the synthetic demo', exact: true }).click();
  await page.setViewportSize({ width: 800, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make the learning visible.' })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Data & export', exact: true }).click();
  const reset = page.getByRole('button', { name: 'Reset entire workspace', exact: true });
  await reset.scrollIntoViewIfNeeded();
  expect(await reset.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  })).toBe(true);
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();

  await page.getByRole('button', { name: 'New offer', exact: true }).click();
  const pasteTab = page.getByRole('tab', { name: 'Paste offer text', exact: true });
  const pdfTab = page.getByRole('tab', { name: 'Read a PDF', exact: true });
  await pasteTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(pdfTab).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(pasteTab).toHaveAttribute('aria-selected', 'true');
});

test('comparison cards stay within narrow viewports', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the synthetic demo', exact: true }).click();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Compare offers' }).click();
  await page.getByRole('button', { name: 'Load synthetic second offer', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Term-by-term comparison' })).toBeVisible();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test('JSON export can be restored after a confirmed workspace reset', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the synthetic demo', exact: true }).click();
  await page.getByRole('button', { name: 'Data & export', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download offer JSON', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.getByRole('button', { name: 'Reset entire workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, reset everything', exact: true }).click();
  await page.getByRole('button', { name: 'Data & export', exact: true }).click();
  await page.locator('#import-json').setInputFiles(path!);
  await expect(page.getByRole('heading', { name: 'A decision you can explain.' })).toBeVisible();
  await expect(page.getByText('Northstar Studio (synthetic)', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
