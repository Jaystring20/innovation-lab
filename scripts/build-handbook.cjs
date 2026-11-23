#!/usr/bin/env node
/**
 * Builds public/downloads/apen-2027-competition-handbook.pdf from
 * docs/handbook/apen-2027-handbook.html.
 *
 * Usage (from the repo root):
 *   npm install --no-save playwright && npx playwright install chromium
 *   node scripts/build-handbook.cjs
 *
 * Playwright is not a project dependency: the handbook changes a few times a
 * year, and the app build should not download a browser.
 */
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'docs/handbook/apen-2027-handbook.html');
const output = path.join(root, 'public/downloads/apen-2027-competition-handbook.pdf');

const small = 'font-family: Arial, Helvetica, sans-serif; font-size: 7pt; color: #777; width: 100%; text-align: center;';

(async () => {
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const page = await browser.newPage();
  await page.goto('file://' + source, { waitUntil: 'load' });
  await page.pdf({
    path: output,
    format: 'Letter',
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="${small}"><span class="title"></span></div>`,
    footerTemplate: `<div style="${small}"><span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    tagged: true,
  });
  await browser.close();
  console.log('Wrote', path.relative(root, output));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
