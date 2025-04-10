import { test, expect, Page } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SenslerdeutschesWoerterbuch/);
});

// Add debug logging functions
async function logNetworkRequests(page: Page) {
  page.on('request', request => {
    console.log(`📤 Request: ${request.method()} ${request.url()}`);
    if (request.postData()) {
      console.log(`📦 Request data: ${request.postData()}`);
    }
  });
  
  page.on('response', response => {
    console.log(`📥 Response: ${response.status()} for ${response.url()}`);
    response.text().then(body => {
      if (body.length < 1000) {
        console.log(`📄 Response body: ${body}`);
      } else {
        console.log(`📄 Response body too large: ${body.length} bytes`);
      }
    }).catch(e => console.log(`⚠️ Can't get response body: ${e}`));
  });
  
  page.on('console', msg => {
    console.log(`🌐 Browser console [${msg.type()}]: ${msg.text()}`);
  });
}


test('search functionality without autocomplete', async ({ page }) => {
  // Add verbose logging
  await logNetworkRequests(page);

  // Increase timeout for GitHub Actions
  test.setTimeout(60000);

  await page.goto('/');
  await page.screenshot({ path: `test-results/landing.png` });

  // Log environment data
  console.log("🔍 DEBUG: Current URL:", page.url());
  await page.evaluate(() => {
    console.log("ENV:", JSON.stringify(window["env"] || {}));
    console.log("Angular Environment:", JSON.stringify(window.environment || {}));  
  });
  
  /**
   * Search for "beckertrütscha" and expect to find the entry "Becker·trǜtscha", which should contain as description visible on the
   * details page "vom Bäcker hergestellter Zopf"
   * Note: The Autocomplete component from Angular Material defaults to role=combobox. Seems weird, but it is what it is.
   */
  const searchField = page.getByRole('textbox', { name: 'Suechi' })
  await expect(searchField).toBeVisible();
  await searchField.fill('beckertrütscha');
  await page.screenshot({ path: `test-results/suggestions.png` });
  await searchField.press('Enter');
  await expect(page.getByRole('link', { name: 'Becker·trǜtscha' })).toBeVisible();
  await page.screenshot({ path: `test-results/results.png` });
  await page.getByRole('link', { name: 'Becker·trǜtscha' }).click();
  await page.screenshot({ path: `test-results/details.png` });
  await expect(page.getByText('vom Bäcker hergestellter Zopf')).toBeVisible();
});