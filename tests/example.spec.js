const { test, expect } = require('@playwright/test');

test('Homepage loads and navigation works', async ({ page }) => {
  await page.goto('http://localhost:5001/');
  await expect(page).toHaveTitle(/HomeEase/i);

  // Playwright looks for a link (<a> tag) with the text "Products"
  await page.click('text=Shop Now');

  // Because the user is NOT logged in, products.js will actually redirect them to auth.html!
  // Let's verify that security feature works:
  await expect(page).toHaveURL(/.*auth.html/);
});

test('Unauthenticated users cannot bypass login', async ({ page }) => {
  // Try to go directly to the products page
  await page.goto('http://localhost:5001/products.html');

  // The requireAuth() function in products.js should kick them out
  await expect(page).toHaveURL(/.*auth.html/);
});

test('User can fill out the login form', async ({ page }) => {
  await page.goto('http://localhost:5001/auth.html');

  // Find the email input (assuming it has placeholder="Email" or similar)
  // We can use getByPlaceholder or getByRole
  await page.getByPlaceholder('Email').first().fill('test@example.com');

  // Fill the password
  await page.getByPlaceholder('Password').first().fill('password123');

  // Check that the inputs actually accepted our text
  await expect(page.getByPlaceholder('Email').first()).toHaveValue('test@example.com');
});
