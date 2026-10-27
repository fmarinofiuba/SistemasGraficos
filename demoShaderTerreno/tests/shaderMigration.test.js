import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyShader } from '../src/shaderMigration.js';
import { PRESETS } from '../src/presets.js';

test('los ejemplos actuales no contienen modulaciones periódicas por altura', () => {
  for (const preset of PRESETS) {
    assert.ok(!/sin\(p\.y/.test(preset.source), preset.id);
    assert.equal(migrateLegacyShader(preset.source), preset.source);
  }
});

test('los borradores de las dos versiones anteriores pierden sus bandas de color', () => {
  const formulas = [
    '    float strata = sin(p.y * 0.20);\n    rock *= 0.96 + 0.04 * strata;',
    '    float strata = sin(p.y * 0.20 + fbm(p * 0.025) * 4.0);\n    rock *= 0.91 + 0.09 * strata;',
  ];
  for (const formula of formulas) {
    for (const newline of ['\n', '\r\n']) {
      const source = `// Mi edición\nvec3 rock = miColor;\n${formula}\nreturn rock;`.replaceAll('\n', newline);
      const migrated = migrateLegacyShader(source);
      assert.ok(!migrated.includes('float strata'));
      assert.ok(migrated.includes('vec3 rock = miColor;'));
      assert.ok(migrated.includes('return rock;'));
      assert.equal(migrateLegacyShader(migrated), migrated);
    }
  }
});

test('se elimina solo el relieve periódico que traía la demo, conservando código propio', () => {
  const source = '    rock += sin(p.y * 1.7 + noise3(p * 0.2) * 2.0) * 0.025;\n    rock += miDetalle(p);\n';
  const migrated = migrateLegacyShader(source);
  assert.ok(!migrated.includes('sin(p.y'));
  assert.ok(migrated.includes('rock += miDetalle(p);'));
  const custom = 'float strata = sin(p.y * 0.3);\nrock *= 0.8 + 0.2 * strata;';
  assert.equal(migrateLegacyShader(custom), custom);
});

test('los borradores antiguos reciben la nieve detallada sin reemplazar colores propios', () => {
  const source = 'vec3 snow  = vec3(0.90, 0.94, 0.97);\nfloat snow = noise3(p * 0.5) * 0.025;';
  const migrated = migrateLegacyShader(source);
  assert.ok(migrated.includes('terrainSnowColor(p)'));
  assert.ok(migrated.includes('terrainSnowHeight(p)'));
  const custom = 'vec3 snow = vec3(0.8, 0.9, 1.0);';
  assert.equal(migrateLegacyShader(custom), custom);
});
