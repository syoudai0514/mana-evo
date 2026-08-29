import { test, expect } from '@playwright/test'

test('parent account clearly separates Google login from ManaEvo password on iPhone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/auth/v1/settings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ external: { google: false } })
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'アカウントとクラウド保存' }).click()

  const dialog = page.getByRole('dialog', { name: 'アカウントとクラウド保存' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Googleでログイン' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Googleでログイン' })).toBeDisabled()
  await expect(dialog.getByText('Googleログインは現在、管理者側のGoogle/Supabase設定待ちです。')).toBeVisible()
  await expect(dialog.getByText('ManaEvo用パスワード', { exact: true })).toBeVisible()
  await expect(dialog.getByText('ここにはGoogleアカウントのパスワードを入力しないでください。')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'メールでログイン' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'メールで新規登録' })).toBeVisible()
})
