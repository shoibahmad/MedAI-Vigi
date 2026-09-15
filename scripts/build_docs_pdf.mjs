/**
 * Renders docs/technical-overview.html to a paginated PDF via headless Chrome.
 *
 * Chrome rather than a PDF library because the document is ordinary HTML/CSS:
 * print stylesheets, page breaks and running headers all come for free, and the
 * source stays editable by anyone who can edit a web page.
 *
 *   node scripts/build_docs_pdf.mjs
 *
 * Needs puppeteer-core and a local Chrome; set CHROME_PATH to override.
 */
import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const chrome = `<div style="font-size:7pt;color:#94a3b8;width:100%;padding:0 16mm;
  font-family:'Segoe UI',Arial,sans-serif;display:flex;justify-content:space-between;">`

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.goto(`file://${resolve(root, 'docs/technical-overview.html')}`, {
  waitUntil: 'networkidle0',
})
await page.pdf({
  path: resolve(root, 'docs/PhenoRx-Technical-Overview.pdf'),
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
  headerTemplate: `${chrome}<span>PhenoRx &mdash; Technical &amp; Methodological Overview</span>
    <span>Research prototype &middot; not for clinical use</span></div>`,
  footerTemplate: `${chrome}<span>System version 2.1.0</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
})
await browser.close()
console.log('docs/PhenoRx-Technical-Overview.pdf written')
