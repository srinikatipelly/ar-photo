const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto('https://localhost:3000/upload', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'C:\\Temp\\upload-empty.png', fullPage: true });

  await page.fill('input[type="email"]', 'test@example.com');
  await page.setInputFiles('input[accept*="image"]', 'C:\\Temp\\test-photo.jpg');
  await page.setInputFiles('input[accept*="video"]', 'C:\\Temp\\test-video.mp4');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:\\Temp\\upload-filled.png', fullPage: true });
  await browser.close();
  process.exit(0);
})();