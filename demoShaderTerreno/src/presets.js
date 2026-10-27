const weights = (natural) => `// Los pesos están ordenados: pasto, suelo, roca, nieve.
vec4 terrainWeights(vec3 p, vec3 n) {
    float slope = 1.0 - clamp(n.y, 0.0, 1.0);
    float variation = ${natural ? '(fbm(p * uNoiseScale) - 0.5) * uNoiseAmount' : '0.0'};
    float rock = smoothstep(uRockSlope - 0.10,
                            uRockSlope + 0.10, slope + variation * 0.25);
    // La suavidad controla tanto el límite de altura como el de pendiente.
    float snow = smoothstep(uSnowHeight - 22.0 * uSnowBlend, uSnowHeight + 22.0 * uSnowBlend,
                            p.y + variation * 90.0);
    snow *= terrainSnowSlopeMask(slope);

    vec3 wind = normalize(vec3(cos(uWindAngle), 0.25, sin(uWindAngle)));
    float exposed = smoothstep(0.15, 0.8, dot(n, wind));
    float dirt = ${natural ? 'clamp(exposed * 0.6 + variation + 0.25, 0.0, 1.0)' : 'exposed * 0.65'};

    // Composición con prioridad. La suma de los pesos es 1.
    return vec4((1.0 - snow) * (1.0 - rock) * (1.0 - dirt),
                (1.0 - snow) * (1.0 - rock) * dirt,
                (1.0 - snow) * rock, snow);
}`;

const flatColor = `vec3 terrainAlbedo(vec3 p, vec3 n, vec4 w) {
    // Colores lineales: la iluminación la conserva Three.js.
    return w.x * vec3(0.12, 0.20, 0.055)
         + w.y * vec3(0.32, 0.21, 0.10)
         + w.z * vec3(0.30, 0.29, 0.26)
         + w.w * vec3(0.90, 0.94, 0.97);
}`;

const tiledColor = (variation) => `vec3 terrainAlbedo(vec3 p, vec3 n, vec4 w) {
    // Imágenes IA seamless; metros por mosaico: pasto 4, suelo 3, roca 12.
    // No cambian con el zoom ni con los controles de distribución.
    vec3 grass = ${variation ? 'sampleVaried' : 'sampleSurface'}(uGrass, p, n, 4.0).rgb;
    vec3 dirt  = ${variation ? 'sampleVaried' : 'sampleSurface'}(uDirt,  p, n, 3.0).rgb;
    vec3 rock  = ${variation ? 'sampleVaried' : 'sampleSurface'}(uRock,  p, n, 12.0).rgb;
    vec3 snow  = terrainSnowColor(p);
    ${variation ? `// El mapa macro RGB se aplica después de esta mezcla.
    // La roca no se modula con funciones periódicas de la altura.` : ''}
    return grass * w.x + dirt * w.y + rock * w.z + snow * w.w;
}`;

const noHeight = `float terrainDetailHeight(vec3 p, vec3 n, vec4 w) {
    return 0.0;
}`;

const detailHeight = `float terrainDetailHeight(vec3 p, vec3 n, vec4 w) {
    // Microrelieve independiente: no se infiere altura del brillo de la foto.
    // Amplitudes en metros; sin polígonos repetidos de tipo adoquín.
    float grass = noise3(p * 3.1) * 0.045;
    float dirt  = noise3(p * 2.3) * 0.06 + noise3(p * 6.7) * 0.02;
    float rock  = noise3(p * 0.35) * 0.18 + noise3(p * 1.8) * 0.07;
    float snow = terrainSnowHeight(p);
    return (grass * w.x + dirt * w.y + rock * w.z + snow * w.w) * uRelief;
}`;

const makeSource = (natural, textured, varied, relief) => [
  weights(natural), textured ? tiledColor(varied) : flatColor,
  relief ? detailHeight : noHeight,
].join('\n\n');

export const PRESETS = [
  {
    id: 'distribution', title: 'Distribución', short: 'Reglas del terreno',
    description: 'La altura, la pendiente y la exposición al viento deciden dónde aparece cada material. Los colores planos hacen visibles esas reglas.',
    experiment: 'Mové la cota de nieve. Después cambiá el umbral de roca y observá la vista «Pesos».',
    source: makeSource(false, false, false, false),
  },
  {
    id: 'transitions', title: 'Transiciones', short: 'Irregularidad natural',
    description: 'El ruido modifica las fronteras entre materiales. La distribución sigue respondiendo al terreno, pero pierde sus límites uniformes.',
    experiment: 'Compará con el ejemplo anterior y llevá la irregularidad a cero para aislar el efecto del ruido.',
    source: makeSource(true, false, false, false),
  },
  {
    id: 'textures', title: 'Detalle local', short: 'Tres texturas pequeñas',
    description: 'Tres imágenes IA de 1254 × 1254 aportan detalle local. Su escala está expresada en metros y permanece fija mientras acercás la cámara.',
    experiment: 'Acercate al terreno. Activá «Proyección triplanar» y compará el estiramiento de las paredes.',
    source: makeSource(true, true, false, false),
  },
  {
    id: 'variation', title: 'Variación', short: 'Romper la repetición',
    description: 'Muestreo estocástico con transformaciones locales y un mapa macro por material reducen la repetición sin cambiar el tamaño del detalle.',
    experiment: 'Compará con el ejemplo anterior: el tamaño del grano se conserva y cambia la organización visual del conjunto.',
    source: makeSource(true, true, true, false),
  },
  {
    id: 'relief', title: 'Relieve', short: 'La superficie responde a la luz',
    description: 'Un microrelieve procedural independiente de las imágenes perturba la normal de iluminación. La normal original sigue controlando la distribución.',
    experiment: 'Acercate a una ladera y mové el sol. Alterná «Normal base» y «Normal con detalle». El relieve no modifica la silueta.',
    source: makeSource(true, true, true, true),
  },
];
