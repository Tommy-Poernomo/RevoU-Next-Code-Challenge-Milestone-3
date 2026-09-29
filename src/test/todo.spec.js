import { test, expect } from '@playwright/test';

// Ganti 5173 jika app Anda berjalan di port 3000
const BASE_URL = 'http://localhost:5173';

test.describe('Todo List UI & Security Automation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Masuk ke aplikasi dan reset localStorage sebelum tiap tes
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Harus berhasil menambahkan todo baru', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Tugas Pertama Playwright');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verifikasi teks item tampil
    await expect(page.locator('.todo-text')).toHaveText('Tugas Pertama Playwright');
    // Verifikasi counter total bertambah
    await expect(page.locator('.stats')).toContainText('Total: 1');
  });

  test('2. Harus aman dari serangan XSS (Security Test)', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    const xssPayload = '<img src=x onerror=alert(1)>';
    await input.fill(xssPayload);
    await page.getByRole('button', { name: 'Add' }).click();

    // Verifikasi payload dirender sebagai string teks biasa, bukan dieksekusi browser
    const todoTextElement = page.locator('.todo-text');
    await expect(todoTextElement).toHaveText(xssPayload);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  });

  test('3. Harus bisa toggle status completed dan filtering (Active / Completed)', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Belajar Testing UI');
    await page.getByRole('button', { name: 'Add' }).click();

    // Tandai selesai (klik checkbox)
    const checkbox = page.getByRole('checkbox');
    await checkbox.check();
    await expect(page.locator('.stats')).toContainText('Completed: 1');

    // Klik filter 'Active' -> todo harus disembunyikan
    await page.getByRole('button', { name: 'Active' }).click();
    await expect(page.locator('.todo-item')).toHaveCount(0);

    // Klik filter 'Completed' -> todo harus muncul
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  test('4. Harus bisa menghapus todo', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Item yang akan dihapus');
    await page.getByRole('button', { name: 'Add' }).click();

    // Klik tombol delete
    await page.getByRole('button', { name: 'Delete' }).click();

    // Verifikasi list kosong
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('.stats')).toContainText('Total: 0');
  });
});