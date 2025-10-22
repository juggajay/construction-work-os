import { test, expect } from '@playwright/test';

test.describe('Daily Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can view daily reports list', async ({ page }) => {
    // Navigate to project
    await page.goto('/test-org/projects/test-project-id/daily-reports');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Daily Reports');

    // Check filter buttons exist
    await expect(page.locator('text=All')).toBeVisible();
    await expect(page.locator('text=Draft')).toBeVisible();
    await expect(page.locator('text=Submitted')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();

    // Check "New Report" button exists
    await expect(page.locator('text=New Report')).toBeVisible();
  });

  test('user can create a new daily report', async ({ page }) => {
    // Navigate to daily reports
    await page.goto('/test-org/projects/test-project-id/daily-reports');

    // Click "New Report" button
    await page.click('text=New Report');

    // Wait for form to load
    await expect(page.locator('h1')).toContainText('Create Daily Report');

    // Fill in basic information
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[name="reportDate"]', today);

    // Fill in weather information
    await page.click('text=Condition');
    await page.click('text=Clear');

    await page.fill('[name="temperatureHigh"]', '75');
    await page.fill('[name="temperatureLow"]', '55');
    await page.fill('[name="precipitation"]', '0');
    await page.fill('[name="windSpeed"]', '10');
    await page.fill('[name="humidity"]', '60');

    // Fill in narrative
    await page.fill(
      '[name="narrative"]',
      'Concrete foundation work completed. Started framing on west wing.'
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to detail page
    await page.waitForURL(/\/daily-reports\/[a-f0-9-]+$/);

    // Verify report was created
    await expect(page.locator('text=Draft')).toBeVisible();
    await expect(page.locator('text=Concrete foundation work completed')).toBeVisible();
  });

  test('user can filter daily reports by status', async ({ page }) => {
    await page.goto('/test-org/projects/test-project-id/daily-reports');

    // Click "Draft" filter
    await page.click('text=Draft');

    // URL should include status filter
    await expect(page).toHaveURL(/status=draft/);

    // Click "Submitted" filter
    await page.click('text=Submitted');
    await expect(page).toHaveURL(/status=submitted/);

    // Click "All" to clear filter
    await page.click('text=All');
    await expect(page).toHaveURL(/^((?!status=).)*$/);
  });

  test('user can view daily report details', async ({ page }) => {
    // Navigate to a specific report (assuming one exists)
    await page.goto('/test-org/projects/test-project-id/daily-reports/test-report-id');

    // Check report details are visible
    await expect(page.locator('h1')).toBeVisible();

    // Weather widget should be present
    await expect(page.locator('text=Weather Conditions')).toBeVisible();

    // Check for Edit button (if draft)
    const editButton = page.locator('text=Edit');
    if (await editButton.isVisible()) {
      await expect(editButton).toBeVisible();
    }

    // Check for Export PDF button
    await expect(page.locator('text=Export PDF')).toBeVisible();

    // Check for Print button
    await expect(page.locator('text=Print')).toBeVisible();
  });

  test('user can edit a draft daily report', async ({ page }) => {
    // Create a draft report first
    await page.goto('/test-org/projects/test-project-id/daily-reports/new');

    const today = new Date().toISOString().split('T')[0];
    await page.fill('[name="reportDate"]', today);
    await page.fill('[name="narrative"]', 'Initial narrative');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/daily-reports\/[a-f0-9-]+$/);

    // Click Edit button
    await page.click('text=Edit');

    // Update narrative
    await page.fill('[name="narrative"]', 'Updated narrative with more details');

    // Save changes
    await page.click('button[type="submit"]');

    // Verify changes
    await expect(page.locator('text=Updated narrative with more details')).toBeVisible();
  });

  test('user cannot edit a submitted daily report', async ({ page }) => {
    // Navigate to a submitted report
    await page.goto('/test-org/projects/test-project-id/daily-reports/submitted-report-id');

    // Edit button should not be visible
    await expect(page.locator('text=Edit')).not.toBeVisible();

    // Status should show as Submitted
    await expect(page.locator('text=Submitted')).toBeVisible();
  });

  test('user can add crew entries to daily report', async ({ page }) => {
    // Navigate to edit page
    await page.goto(
      '/test-org/projects/test-project-id/daily-reports/draft-report-id/edit'
    );

    // Click "Add Crew Entry" button
    await page.click('text=Add Crew Entry');

    // Fill in crew entry form
    await page.fill('[name="trade"]', 'Carpenter');
    await page.fill('[name="classification"]', 'Journeyman');
    await page.fill('[name="headcount"]', '5');
    await page.fill('[name="hoursWorked"]', '40');

    // Save entry
    await page.click('button:has-text("Save Entry")');

    // Verify entry appears in list
    await expect(page.locator('text=Carpenter')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible();
    await expect(page.locator('text=40')).toBeVisible();
  });

  test('user can upload photos to daily report', async ({ page }) => {
    // Navigate to edit page
    await page.goto(
      '/test-org/projects/test-project-id/daily-reports/draft-report-id/edit'
    );

    // Set up file chooser listener
    const fileChooserPromise = page.waitForEvent('filechooser');

    // Click upload button
    await page.click('text=Upload Photo');

    const fileChooser = await fileChooserPromise;

    // Upload a test image
    await fileChooser.setFiles({
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
    });

    // Wait for upload to complete
    await expect(page.locator('text=Photo uploaded successfully')).toBeVisible({
      timeout: 10000,
    });

    // Verify photo appears in gallery
    await expect(page.locator('img[alt*="Daily report photo"]')).toBeVisible();
  });

  test('user can submit a daily report', async ({ page }) => {
    // Navigate to draft report with required data
    await page.goto(
      '/test-org/projects/test-project-id/daily-reports/complete-draft-id'
    );

    // Click Edit button
    await page.click('text=Edit');

    // Ensure report has required fields
    const narrative = await page.locator('[name="narrative"]').inputValue();
    if (!narrative) {
      await page.fill('[name="narrative"]', 'Work completed as planned');
    }

    // Click Submit button
    await page.click('text=Submit for Approval');

    // Confirm submission
    await page.click('text=Confirm');

    // Verify status changed to Submitted
    await expect(page.locator('text=Submitted')).toBeVisible();

    // Edit button should no longer be visible
    await expect(page.locator('text=Edit')).not.toBeVisible();
  });

  test('supervisor can approve a submitted daily report', async ({ page }) => {
    // Login as supervisor
    await page.goto('/logout');
    await page.goto('/login');
    await page.fill('[name="email"]', 'supervisor@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to submitted report
    await page.goto(
      '/test-org/projects/test-project-id/daily-reports/submitted-report-id'
    );

    // Click Approve button
    await page.click('text=Approve Report');

    // Confirm approval
    await page.click('text=Confirm Approval');

    // Verify status changed to Approved
    await expect(page.locator('text=Approved')).toBeVisible();
  });

  test('user can export daily report to PDF', async ({ page }) => {
    await page.goto('/test-org/projects/test-project-id/daily-reports/test-report-id');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Export PDF button
    await page.click('text=Export PDF');

    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/daily-report.*\.pdf$/);
  });

  test('user can copy entries from previous report', async ({ page }) => {
    await page.goto('/test-org/projects/test-project-id/daily-reports/new');

    // Click "Copy from Previous" button
    await page.click('text=Copy from Previous');

    // Select a previous report from list
    await page.click('[data-report-id="previous-report-id"]');

    // Verify crew entries were copied
    await expect(page.locator('text=Carpenter')).toBeVisible();
    await expect(page.locator('text=Electrician')).toBeVisible();

    // Verify equipment entries were copied
    await expect(page.locator('text=Excavator')).toBeVisible();
  });

  test('validation prevents submission of incomplete report', async ({ page }) => {
    await page.goto('/test-org/projects/test-project-id/daily-reports/draft-report-id');

    await page.click('text=Edit');

    // Clear required fields
    await page.fill('[name="narrative"]', '');

    // Try to submit
    await page.click('text=Submit for Approval');

    // Error message should appear
    await expect(
      page.locator('text=Report must have entries or narrative')
    ).toBeVisible();

    // Status should remain draft
    await expect(page.locator('text=Draft')).toBeVisible();
  });

  test('user can delete crew entry from draft report', async ({ page }) => {
    await page.goto(
      '/test-org/projects/test-project-id/daily-reports/draft-with-entries-id/edit'
    );

    // Find crew entry and click delete
    await page.click('[data-entry-type="crew"][data-entry-id="entry-id-1"] button:has-text("Delete")');

    // Confirm deletion
    await page.click('text=Confirm Delete');

    // Verify entry is removed
    await expect(page.locator('[data-entry-id="entry-id-1"]')).not.toBeVisible();
  });
});
