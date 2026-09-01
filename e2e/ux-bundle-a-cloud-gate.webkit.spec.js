import { test, expect } from '@playwright/test'

const PIN_KEY = 'mana-evo-parent-pin-v1'

test('cloud status may be visible to a child but cloud mutations require Parent PIN', async ({ page }) => {
  await page.addInitScript((pinKey) => localStorage.setItem(pinKey, '1234'), PIN_KEY)
  await page.goto('/')

  await page.getByRole('button', { name: 'アカウントとクラウド保存' }).click()
  const cloud = page.getByRole('dialog', { name: 'アカウントとクラウド保存' })
  await expect(cloud).toBeVisible()
  await expect(cloud.locator('.cloud-status')).toBeVisible()

  const gate = cloud.locator('.adult-cloud-gate')
  await expect(gate).toBeVisible()
  await expect(cloud.getByRole('button', { name: 'ログイン', exact: true })).toHaveCount(0)
  await expect(cloud.getByRole('button', { name: '全開放・全キャラ' })).toHaveCount(0)

  await gate.locator('input').fill('1234')
  await gate.getByRole('button', { name: '🔓 保護者メニューをひらく' }).click()
  await expect(gate).toHaveCount(0)
  await expect(cloud.getByRole('button', { name: 'ログイン', exact: true })).toHaveCount(1)
  await expect(cloud.getByRole('button', { name: '全開放・全キャラ' })).toBeVisible()
})
