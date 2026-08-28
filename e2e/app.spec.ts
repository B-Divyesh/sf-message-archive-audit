import { test, expect } from '@playwright/test'
test('audits the included safe example and remains available offline', async ({ page, context }) => {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page).toHaveTitle(/Archive Audit/)
  await expect(page.locator('main h1')).toHaveText(/Keep the evidence/)
  await page.getByRole('button', { name: 'Load a safe example' }).click()
  await expect(page.getByText('Archive inventory complete')).toBeVisible()
  await expect(page.getByText('Embedded & hashed', { exact: true }).last()).toBeVisible()
  await context.setOffline(true)
  await expect(page.locator('main h1')).toBeVisible()
  expect(errors).toEqual([])
})
