import { test, expect } from '@playwright/test';

test('los cinco ejemplos compilan en WebGL 2 y las vistas de inspección funcionan', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#compile-status')).toHaveText('Shader compilado');
  for (let stage = 0; stage < 5; stage++) {
    await page.locator(`[data-stage="${stage}"]`).click();
    await expect(page.locator('#compile-status')).toHaveText('Shader compilado');
    await expect(page.locator('#compile-errors')).toBeHidden();
    await expect(page.locator(`[data-stage="${stage}"]`)).toHaveAttribute('aria-pressed', 'true');
    if (stage < 4) await expect(page.locator('[data-control="relief"] input')).toBeDisabled();
    else await expect(page.locator('[data-control="relief"] input')).toBeEnabled();
    expect(await page.evaluate(() => window.terrainLab.lab.terrain.material.defines.TERRAIN_USE_MACRO)).toBe(stage >= 3 ? 1 : 0);
    if (stage < 3) await expect(page.locator('[data-control="macroEnabled"] input')).toBeDisabled();
    else await expect(page.locator('[data-control="macroEnabled"] input')).toBeEnabled();
  }
  await expect(page.locator('#floating-controls').getByText('Parámetros', { exact: true })).toHaveCount(0);
  const materialId = await page.evaluate(() => window.terrainLab.lab.terrain.material.uuid);
  await page.locator('[data-control="macroEnabled"] input').uncheck();
  expect(await page.evaluate(() => window.terrainLab.lab.uniforms.uMacroEnabled.value)).toBe(0);
  await page.locator('[data-control="macroEnabled"] input').check();
  expect(await page.evaluate(() => window.terrainLab.lab.uniforms.uMacroEnabled.value)).toBe(1);
  expect(await page.evaluate(() => window.terrainLab.lab.terrain.material.uuid)).toBe(materialId);
  await page.locator('#floating-controls').getByText('Vista', { exact: true }).click();
  for (let view = 0; view < 7; view++) {
    await page.locator('[data-control="view"] select').selectOption(String(view));
    await expect.poll(() => page.evaluate(() => window.terrainLab.lab.uniforms.uView.value)).toBe(view);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.locator('[data-control="view"] select').selectOption('0');
  await page.screenshot({ path: testInfo.outputPath('terreno-desktop.png'), fullPage: true });
  const programs = await page.evaluate(() => {
    const { renderer } = window.terrainLab.lab;
    const gl = renderer.getContext();
    return renderer.info.programs.map((program) => gl.getProgramParameter(program.program, gl.LINK_STATUS));
  });
  expect(programs.length).toBeGreaterThan(0);
  expect(programs.every(Boolean)).toBe(true);
  expect(errors).toEqual([]);
});

test('un error GLSL conserva el material válido, identifica la línea y permite recuperarlo', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#compile-status')).toHaveText('Shader compilado');
  const originalMaterial = await page.evaluate(() => window.terrainLab.lab.terrain.material.uuid);
  const invalid = await page.evaluate(() => {
    const app = window.terrainLab;
    app.editor.setSource(app.editor.source.replace('return vec4(', 'return unknownFunction('));
    return app.compile();
  });
  expect(invalid.ok).toBe(false);
  await expect(page.locator('#compile-errors')).toBeVisible();
  await expect(page.locator('#error-line')).toBeVisible();
  expect(await page.evaluate(() => window.terrainLab.lab.terrain.material.uuid)).toBe(originalMaterial);
  await page.locator('#restore').click();
  await expect(page.locator('#compile-status')).toHaveText('Shader compilado');
  await expect(page.locator('#compile-errors')).toBeHidden();

  // Un cambio válido también debe cambiar el programa: prueba la clave de caché.
  const edited = await page.evaluate(() => {
    const app = window.terrainLab;
    const source = app.editor.source.replace('terrainSnowColor(p)', 'vec3(0.9, 0.05, 0.05)');
    app.editor.setSource(source);
    const result = app.compile();
    return { result, key: app.lab.terrain.material.customProgramCacheKey(), source };
  });
  expect(edited.result.ok).toBe(true);
  expect(edited.key).toBe(edited.source);
  await expect(page.locator('#edited-label')).toBeVisible();
  await page.reload();
  await expect(page.locator('#compile-status')).toHaveText('Shader compilado');
  expect(await page.evaluate(() => window.terrainLab.editor.source)).toBe(edited.source);
});

test('comparación, controles sin recompilar y distribución móvil', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#compile-status')).toHaveText('Shader compilado');
  const uuid = await page.evaluate(() => window.terrainLab.lab.terrain.material.uuid);
  const snow = page.locator('[data-control="snow"] input');
  await snow.fill('260');
  await snow.press('Enter');
  await expect(snow).toHaveValue('260');
  expect(await page.evaluate(() => window.terrainLab.lab.uniforms.uSnowHeight.value)).toBe(260);
  expect(await page.evaluate(() => window.terrainLab.lab.terrain.material.uuid)).toBe(uuid);
  await page.locator('#floating-controls').getByText('Vista', { exact: true }).click();
  const wireframe = page.locator('[data-control="wireframe"] input');
  await wireframe.check();
  expect(await page.evaluate(() => window.terrainLab.lab.wireframe.visible)).toBe(true);
  expect(await page.evaluate(() => window.terrainLab.lab.terrain.material.wireframe)).toBe(false);
  await wireframe.uncheck();
  const comparison = page.locator('[data-control="compare"] input');
  await comparison.check();
  await expect(page.locator('.compare-divider')).toBeVisible();
  await expect(comparison).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('terreno-comparacion.png') });
  await comparison.uncheck();
  await expect(comparison).not.toBeChecked();
  await page.getByRole('button', { name: 'Acercar cámara', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('terreno-detalle.png') });
  const relief = await page.evaluate(() => {
    const { lab } = window.terrainLab;
    const { renderer, uniforms, validationTarget } = lab;
    const previousTarget = renderer.getRenderTarget();
    const previousView = uniforms.uView.value;
    const previousStrength = uniforms.uRelief.value;
    const sample = (view, strength) => {
      uniforms.uView.value = view;
      uniforms.uRelief.value = strength;
      renderer.setRenderTarget(validationTarget);
      renderer.render(lab.scene, lab.camera);
      const pixels = new Uint8Array(8 * 8 * 4);
      renderer.readRenderTargetPixels(validationTarget, 0, 0, 8, 8, pixels);
      return pixels;
    };
    try {
      const normalA = sample(6, 0), normalB = sample(6, 1);
      const weightsA = sample(1, 0), weightsB = sample(1, 1);
      return {
        changesNormal: normalA.some((value, i) => value !== normalB[i]),
        preservesMasks: weightsA.every((value, i) => value === weightsB[i]),
      };
    } finally {
      uniforms.uView.value = previousView;
      uniforms.uRelief.value = previousStrength;
      renderer.setRenderTarget(previousTarget);
      lab.invalidate();
    }
  });
  expect(relief.changesNormal).toBe(true);
  expect(relief.preservesMasks).toBe(true);
  await page.getByRole('button', { name: 'Restablecer cámara', exact: true }).click();
  await page.getByRole('button', { name: 'Guía del shader', exact: true }).click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#viewport')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.terrainLab.editor.pagination.total)).toBeGreaterThan(1);
  const dimensions = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    verticalOverflow: document.documentElement.scrollHeight > innerHeight,
    navigation: document.querySelector('.stages').getBoundingClientRect().height,
    toolbar: document.querySelector('.editor-toolbar').getBoundingClientRect().height,
  }));
  expect(dimensions.horizontalOverflow).toBe(false);
  expect(dimensions.verticalOverflow).toBe(false);
  expect(dimensions.navigation).toBeLessThanOrEqual(25);
  expect(dimensions.toolbar).toBeLessThanOrEqual(29);
  const source = await page.evaluate(() => window.terrainLab.editor.source);
  await page.locator('#next-page').click();
  expect(await page.evaluate(() => window.terrainLab.editor.pagination.page)).toBe(1);
  expect(await page.evaluate(() => window.terrainLab.editor.source)).toBe(source);
  await page.locator('#previous-page').click();
  expect(await page.evaluate(() => window.terrainLab.editor.pagination.page)).toBe(0);
  await page.evaluate(() => {
    const editor = window.terrainLab.editor;
    editor.goToLine(editor.source.split('\n').length);
  });
  await expect.poll(() => page.evaluate(() => {
    const { page, total } = window.terrainLab.editor.pagination;
    return page === total - 1;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('terreno-mobile.png'), fullPage: true });
});
