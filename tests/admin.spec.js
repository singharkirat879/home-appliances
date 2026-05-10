const { test, expect } = require('@playwright/test');

test.describe('Admin Panel Tests', () => {

  test('Unauthenticated users should only see the login screen', async ({ page }) => {
    // 1. Go to the Admin page
    await page.goto('http://localhost:5001/admin.html');

    // 2. Verify that the login screen is visible
    const loginScreen = page.locator('#admin-login-screen');
    await expect(loginScreen).toBeVisible();

    // 3. Verify that the dashboard screen is NOT visible
    const dashboardScreen = page.locator('#admin-dashboard-screen');
    await expect(dashboardScreen).toBeHidden();
  });

  test('Admin login fails with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5001/admin.html');

    // 1. Fill in wrong username and password
    await page.locator('#admin-username').fill('wrongadmin');
    await page.locator('#admin-password').fill('wrongpassword123');

    // 2. Click the Login button
    // The button has text 'Login' and is of type submit
    await page.locator('button[type="submit"]:has-text("Login")').click();

    // 3. Verify the error message appears
    const errorMsg = page.locator('#login-error');
    
    // We expect the error message to become visible and contain text
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).not.toBeEmpty();
  });

});
