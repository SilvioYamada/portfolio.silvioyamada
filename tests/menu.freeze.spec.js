const { test, expect } = require('@playwright/test');

test.describe('freezeActive behavior', () => {
  test('freeze prevents scroll spy from updating active link', async ({ page }) => {
    await page.goto('/index.html');

    const heroLink = page.locator('nav ul li a[href="#hero"]');
    const aboutLink = page.locator('nav ul li a[href="#about"]');

    await expect(heroLink).toHaveClass(/active/);

    // Freeze active (simulate parent message)
    await page.evaluate(() => {
      window.postMessage({ type: 'freezeActive' }, '*');
    });

    // Scroll into 'about' section and wait for potential changes
    await page.evaluate(() => document.getElementById('about').scrollIntoView());
    await page.waitForTimeout(500);

    // While frozen, active should remain hero
    await expect(heroLink).toHaveClass(/active/);
    await expect(aboutLink).not.toHaveClass(/active/);

    // Unfreeze and scroll again; now the about should become active
    await page.evaluate(() => {
      window.postMessage({ type: 'unfreezeActive' }, '*');
    });
    await page.evaluate(() => document.getElementById('about').scrollIntoView());
    await page.waitForTimeout(500);
    await expect(aboutLink).toHaveClass(/active/);
  });
});
