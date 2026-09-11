import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  // 1. Home Page
  console.log('Capturing Home Page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_home_hero.png'), fullPage: false });
  
  // Scroll home page section
  await page.evaluate(() => window.scrollTo(0, 1000));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_home_features.png'), fullPage: false });

  // 2. Auth Page
  console.log('Capturing Auth Page...');
  await page.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_auth_login.png'), fullPage: false });

  // 3. Guest Login to access Workspaces & Analytics
  console.log('Triggering Guest Login...');
  const guestBtn = await page.$('button');
  if (guestBtn) {
    // Click guest button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('GUEST') || b.textContent.includes('Guest'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2500));
  }

  // 4. Workspaces Page
  console.log('Capturing Workspaces Page...');
  await page.goto('http://localhost:5173/workspaces', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_workspaces_list.png'), fullPage: false });

  // Open Schema Builder / Workspace Modal if available
  const newWsBtn = await page.$('button');
  if (newWsBtn) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('CREATE') || b.textContent.includes('WORKSPACE') || b.textContent.includes('NEW'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_schema_builder_modal.png'), fullPage: false });
    
    // Close modal (Press Escape or click background/close)
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // 5. Records Table Page
  console.log('Capturing Records Table Page...');
  // Find first workspace link or navigate to records
  const workspaceRows = await page.$$('a');
  let recordsUrl = '';
  for (const row of workspaceRows) {
    const href = await page.evaluate(el => el.getAttribute('href'), row);
    if (href && href.includes('/records')) {
      recordsUrl = 'http://localhost:5173' + href;
      break;
    }
  }

  if (recordsUrl) {
    await page.goto(recordsUrl, { waitUntil: 'networkidle0' });
  } else {
    // Fallback if no workspace link found
    await page.goto('http://localhost:5173/workspaces', { waitUntil: 'networkidle0' });
    const viewButtons = await page.$$('button, a');
    for (const btn of viewButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('VIEW') || text.includes('RECORDS') || text.includes('OPEN'))) {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_records_datagrid.png'), fullPage: false });

  // Open New Record Modal if present
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('ADD') || b.textContent.includes('RECORD') || b.textContent.includes('INSERT'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_record_entry_modal.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // 6. Real-Time Analytics Dashboard
  console.log('Capturing Analytics Dashboard...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_analytics_dashboard.png'), fullPage: false });

  // Scroll down for Charts and Audit Feed
  await page.evaluate(() => window.scrollTo(0, 600));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_vibrant_charts.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 1200));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_activity_audit_log.png'), fullPage: false });

  // 7. About Page
  console.log('Capturing About Page...');
  await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_about_editorial.png'), fullPage: false });

  // 8. Support Page
  console.log('Capturing Support Page...');
  await page.goto('http://localhost:5173/support', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_support_page.png'), fullPage: false });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

captureScreenshots().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
