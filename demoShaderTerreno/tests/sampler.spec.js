import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('el muestreo estocástico elimina el periodo del mosaico sin saltos en desplazamientos pequeños', async ({ page }) => {
  await page.goto('/tests/sampler-fixture.html');
  await page.waitForFunction(() => window.samplerResult);
  const result = await page.evaluate(() => window.samplerResult);
  console.log('Muestreo 64×64, sin sombras ni animación:', JSON.stringify(result));
  expect(result.error).toBeUndefined();
  expect(result.glError).toBe(0);
  expect(result.periodicDifference).toBeLessThan(0.3);
  for (const difference of result.translatedDifferences) {
    expect(difference).toBeGreaterThan(result.periodicDifference + 0.5);
  }
  expect(result.continuityDifference).toBeLessThan(1);
  expect(result.normalDiagonalDifference).toBeLessThan(0.1);
  expect(result.vertexNormalDiagonalDifference).toBeGreaterThan(result.normalDiagonalDifference + 0.1);
  expect(result.wireframeDifference).toBeGreaterThan(0.5);
  expect(result.macroColorDifference).toBeGreaterThan(5);
  expect(result.macroHueRange).toBeGreaterThan(15);
  expect(result.snowDetailDifference).toBeGreaterThan(0.2);
});

test('capturas estáticas de nieve, variación amplia y wireframe sin animación', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/surface-preview.html');
  await page.waitForFunction(() => window.surfacePreview);
  const result = await page.evaluate(() => window.surfacePreview);
  expect(result.error).toBeUndefined();
  console.log('Sombras: diferencia al apagar y al restaurar:', result.shadowDifference, result.shadowRestoreDifference);
  expect(result.shadowDifference).toBeGreaterThan(0.1);
  expect(result.shadowRestoreDifference).toBeLessThan(0.1);
  expect(result.droneSelected).toBe(true);
  expect(result.droneMoved).toBeGreaterThan(1);
  expect(result.orbitalRestored).toBe(true);
  for (const name of ['overall', 'detail', 'wireframe', 'snow', 'drone']) {
    await writeFile(testInfo.outputPath(`surface-${name}.png`), Buffer.from(result[name].split(',')[1], 'base64'));
  }
  expect(errors).toEqual([]);
});
