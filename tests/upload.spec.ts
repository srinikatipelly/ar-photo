import { test, expect } from '@playwright/test';
import path from 'path';

test('should upload PNG and MP4 files successfully', async ({ page }) => {
  page.on('console', (msg) => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (error) => console.log(`[BROWSER ERROR] ${error}`));

  // Mock window.MINDAR before any page script runs so compile.ts sees it as already
  // loaded and skips the CDN fetch. compileImageTargets returns a dummy target buffer.
  await page.addInitScript(() => {
    class MockCompiler {
      async compileImageTargets(_images: unknown[], onProgress?: (p: number) => void) {
        if (onProgress) onProgress(1.0);
      }
      exportData() {
        return new ArrayBuffer(256);
      }
    }
    (window as unknown as Record<string, unknown>).MINDAR = {
      IMAGE: { Compiler: MockCompiler },
    };
  });

  await page.goto('/upload');
  await page.waitForSelector('input[type="file"]', { timeout: 10000 });

  const pngPath = path.resolve(__dirname, '../test/nature1.png');
  const mp4Path = path.resolve(__dirname, '../test/16091333_1080_1920_50fps.mp4');

  await page.locator('input[placeholder="jane@example.com"]').fill('test@example.com');
  await page.locator('input[placeholder="Jane Smith"]').fill('Test User');
  await page.locator('input[accept*="image"]').setInputFiles(pngPath);
  await page.locator('input[accept*="video"]').setInputFiles(mp4Path);

  const submitButton = page.locator('button:has-text("Create AR Frame")');
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  // Spinner should appear immediately
  await page.waitForSelector('.animate-spin', { timeout: 30000 });

  const progressText = page.locator('p.text-sm.text-zinc-500').filter({ hasText: /Analysing|Uploading|Creating/ });
  await expect(progressText).toBeVisible({ timeout: 10000 });

  // Wait for the full pipeline (compile mock is instant, upload + frame creation takes real time)
  await page.locator('h1').filter({ hasText: 'Your AR frame is ready' }).waitFor({ timeout: 180000 });

  await expect(page.locator('h1').filter({ hasText: 'Your AR frame is ready' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'test@example.com' })).toBeVisible();
});
