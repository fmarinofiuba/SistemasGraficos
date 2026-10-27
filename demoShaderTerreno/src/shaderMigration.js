// Retira exclusivamente las fórmulas de bandas incluidas en versiones previas
// de esta demo. Conserva las demás ediciones y las funciones personalizadas.
export function migrateLegacyShader(source) {
  return source
    .replace(/smoothstep\(uSnowHeight\s*-\s*22\.0,\s*uSnowHeight\s*\+\s*22\.0,/g,
      'smoothstep(uSnowHeight - 22.0 * uSnowBlend, uSnowHeight + 22.0 * uSnowBlend,')
    .replace(/smoothstep\(0\.20,\s*0\.55,\s*slope\)/g,
      'smoothstep(0.375 - 0.175 * uSnowBlend, 0.375 + 0.175 * uSnowBlend, slope)')
    .replace(/1\.0\s*-\s*smoothstep\(0\.375\s*-\s*0\.175\s*\*\s*uSnowBlend,\s*0\.375\s*\+\s*0\.175\s*\*\s*uSnowBlend,\s*slope\)/g,
      'terrainSnowSlopeMask(slope)')
    .replace(/^[ \t]*float strata\s*=\s*sin\(\s*p\.y\s*\*\s*0\.20\s*(?:\+\s*fbm\(\s*p\s*\*\s*0\.025\s*\)\s*\*\s*4\.0\s*)?\);[ \t]*\r?\n[ \t]*rock\s*\*=\s*(?:0\.91\s*\+\s*0\.09|0\.96\s*\+\s*0\.04)\s*\*\s*strata\s*;[ \t]*\r?\n?/gm,
      '    // Eliminada la modulación periódica por altura.\n')
    .replace(/^[ \t]*rock\s*\+=\s*sin\(\s*p\.y\s*\*\s*1\.7\s*\+\s*noise3\(\s*p\s*\*\s*0\.2\s*\)\s*\*\s*2\.0\s*\)\s*\*\s*0\.025\s*;[ \t]*\r?\n?/gm,
      '    // Eliminado el relieve periódico por altura.\n')
    .replace('Solo agregamos aquí una variación sutil de estratos, sin más fBm.',
      'La roca no se modula con funciones periódicas de la altura.')
    .replace(/vec3 snow\s*=\s*vec3\(0\.90,\s*0\.94,\s*0\.97\);/g, 'vec3 snow = terrainSnowColor(p);')
    .replace(/float snow\s*=\s*(?:noise3\(p\s*\*\s*0\.5\)\s*\*\s*0\.025|fbm\(p\s*\*\s*0\.30\)\s*\*\s*0\.06);/g,
      'float snow = terrainSnowHeight(p);');
}
