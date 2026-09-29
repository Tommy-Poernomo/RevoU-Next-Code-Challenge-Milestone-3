// // @ts-check
// import { test, expect } from '@playwright/test';

// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });


import { test, expect } from '@playwright/test';

// Sesuaikan port dengan yang tampil di terminal React Anda
const APP_URL = 'http://localhost:5173';

test.describe('Todo List Automated Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    // Bersihkan storage lokal agar pengujian selalu mulai dari state bersih
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('TC01 - Tambah todo baru dan validasi statistik counter', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Tugas Playwright Pertama');
    await page.getByRole('button', { name: 'Add' }).click();

    // Pastikan item muncul di DOM
    await expect(page.locator('.todo-text')).toHaveText('Tugas Playwright Pertama');
    // Pastikan statistik counter terupdate
    await expect(page.locator('.stats')).toContainText('Total: 1');
    await expect(page.locator('.stats')).toContainText('Active: 1');
    await expect(page.locator('.stats')).toContainText('Completed: 0');
  });

  test('TC02 - Pencegahan serangan XSS (Security Audit)', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    const payload = '<img src=x onerror=alert(1)>';
    await input.fill(payload);
    await page.getByRole('button', { name: 'Add' }).click();

    // Verifikasi tag tidak dieksekusi sebagai elemen gambar di DOM
    await expect(page.locator('.todo-text')).toHaveText(payload);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });

  test('TC03 - Toggle status completed dan filter (All, Active, Completed)', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Tugas Belajar Filter');
    await page.getByRole('button', { name: 'Add' }).click();

    // Klik checkbox untuk menandai completed
    await page.getByRole('checkbox').check();
    await expect(page.locator('.stats')).toContainText('Completed: 1');

    // Filter Active -> harus tidak ada item
    await page.getByRole('button', { name: 'Active' }).click();
    await expect(page.locator('.todo-item')).toHaveCount(0);

    // Filter Completed -> item harus muncul
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toHaveText('Tugas Belajar Filter');
  });

  test('TC04 - Hapus todo dari daftar', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Item yang akan dihapus');
    await page.getByRole('button', { name: 'Add' }).click();

    // Hapus item
    await page.getByRole('button', { name: 'Delete' }).click();

    // Pastikan item hilang dan total kembali ke 0
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('.stats')).toContainText('Total: 0');
  });
});