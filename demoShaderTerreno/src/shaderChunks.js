export const TERRAIN_GLSL = /* glsl */ `
varying vec3 vTerrainPosition;
varying vec3 vTerrainNormal;
varying vec2 vTerrainMacroUv;
uniform sampler2D uGrass;
uniform sampler2D uDirt;
uniform sampler2D uRock;
uniform sampler2D uMacroMap;
uniform float uMacroEnabled;
uniform float uMacroStrength;
uniform sampler2D uTerrainNormalMap;
uniform float uTerrainNormalsEnabled;
uniform vec2 uTerrainNormalSize;
uniform mat3 uTerrainWorldNormalMatrix;
uniform vec2 uPixelFootprint;
uniform float uSnowDetail;
uniform float uSnowBlend;
uniform float uSnowMaxSlope;
uniform float uSnowHeight;
uniform float uRockSlope;
uniform float uNoiseScale;
uniform float uNoiseAmount;
uniform float uWindAngle;
uniform float uRelief;
uniform float uTriplanar;
uniform float uView;

// Ángulo desde la horizontal: el límite superior no acumula nieve.
float terrainSnowSlopeMask(float slope) {
    float limit = 1.0 - cos(radians(uSnowMaxSlope));
    float start = max(0.0, limit - 0.35 * uSnowBlend);
    return 1.0 - smoothstep(start, max(limit, 0.0001), slope);
}

float terrainHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(terrainHash(i), terrainHash(i + vec3(1,0,0)), f.x),
                   mix(terrainHash(i + vec3(0,1,0)), terrainHash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(terrainHash(i + vec3(0,0,1)), terrainHash(i + vec3(1,0,1)), f.x),
                   mix(terrainHash(i + vec3(0,1,1)), terrainHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.533333;
    for (int i = 0; i < 4; i++) {
        sum += noise3(p) * amp;
        p = p * 2.03 + vec3(17.1, 9.2, 3.7);
        amp *= 0.5;
    }
    return sum;
}

vec3 terrainBaseNormal() {
    if (uTerrainNormalsEnabled < 0.5) return normalize(vTerrainNormal);
    // Reconstrucción bicúbica mediante cuatro lecturas bilineales. El campo
    // no depende de la diagonal que usa cada celda de la malla de triángulos.
    vec2 uv = (vTerrainMacroUv * (uTerrainNormalSize - 1.0) + 0.5) / uTerrainNormalSize;
    vec2 coordinate = uv * uTerrainNormalSize - 0.5;
    vec2 i = floor(coordinate), f = fract(coordinate);
    vec2 om = 1.0 - f;
    vec2 w0 = om * om * om / 6.0;
    vec2 w1 = (3.0 * f * f * f - 6.0 * f * f + 4.0) / 6.0;
    vec2 w2 = (-3.0 * f * f * f + 3.0 * f * f + 3.0 * f + 1.0) / 6.0;
    vec2 w3 = f * f * f / 6.0;
    vec2 g0 = w0 + w1, g1 = w2 + w3;
    vec2 lo = (i - 0.5 + w1 / g0) / uTerrainNormalSize;
    vec2 hi = (i + 1.5 + w3 / g1) / uTerrainNormalSize;
    vec3 a = texture2D(uTerrainNormalMap, vec2(lo.x, lo.y)).xyz;
    vec3 b = texture2D(uTerrainNormalMap, vec2(hi.x, lo.y)).xyz;
    vec3 c = texture2D(uTerrainNormalMap, vec2(lo.x, hi.y)).xyz;
    vec3 d = texture2D(uTerrainNormalMap, vec2(hi.x, hi.y)).xyz;
    vec3 localNormal = (a * g0.x + b * g1.x) * g0.y + (c * g0.x + d * g1.x) * g1.y;
    return normalize(uTerrainWorldNormalMatrix * localNormal);
}

float snowNoiseBand(vec3 p, float frequency) {
    float footprint = length(cameraPosition - p) * uPixelFootprint.x + uPixelFootprint.y;
    float visible = 1.0 - smoothstep(0.25, 0.65, footprint * frequency);
    return mix(0.5, noise3(p * frequency), visible);
}

vec3 terrainSnowColor(vec3 p) {
    float drifts = snowNoiseBand(p, 0.43);
    float grain = snowNoiseBand(p, 3.5);
    float detail = (0.10 * (drifts - 0.5) + 0.06 * (grain - 0.5)) * uSnowDetail;
    return vec3(0.86, 0.90, 0.94) * (1.0 + detail);
}

float terrainSnowHeight(vec3 p) {
    return ((snowNoiseBand(p, 0.65) - 0.5) * 0.10
          + (snowNoiseBand(p, 3.2) - 0.5) * 0.018) * uSnowDetail;
}

float surfaceMicroHeight(vec3 p, float meters) {
    // Compatibilidad con shaders guardados que consultan .a. No leemos
    // altura de la imagen: esta función es un campo procedural continuo.
    return 0.65 * noise3(p * (3.1 / meters))
         + 0.35 * noise3(p * (8.7 / meters));
}

vec4 sampleSurfaceBias(sampler2D map, vec3 p, vec3 n, float meters, float bias) {
    float h = surfaceMicroHeight(p, meters);
    if (uTriplanar < 0.5) return vec4(texture2D(map, p.xz / meters, bias).rgb, h);
    vec3 blend = pow(abs(n), vec3(4.0));
    blend /= max(blend.x + blend.y + blend.z, 0.0001);
    vec3 rgb = texture2D(map, p.yz / meters, bias).rgb * blend.x
             + texture2D(map, p.xz / meters, bias).rgb * blend.y
             + texture2D(map, p.xy / meters, bias).rgb * blend.z;
    return vec4(rgb, h);
}

vec4 sampleSurface(sampler2D map, vec3 p, vec3 n, float meters) {
    return sampleSurfaceBias(map, p, n, meters, 0.0);
}

vec3 stochasticVertex(sampler2D map, vec2 uv, vec2 dx, vec2 dy, vec2 id) {
    float angle = terrainHash(vec3(id, 71.0)) * 6.28318530718;
    float c = cos(angle), s = sin(angle);
    mat2 rotation = mat2(c, -s, s, c);
    vec2 offset = vec2(terrainHash(vec3(id, 13.0)), terrainHash(vec3(id, 37.0))) * 256.0;
    // Gradientes del UV continuo, sin derivar el hash ni los cambios de celda.
    return textureGrad(map, rotation * uv + offset, rotation * dx, rotation * dy).rgb;
}

vec3 sampleStochastic(sampler2D map, vec2 uv) {
    vec2 dx = dFdx(uv), dy = dFdy(uv);
    // Rejilla triangular: las celdas vecinas comparten vértices y muestras.
    // En la frontera desaparece el peso del vértice que cambia de celda.
    vec2 skewed = vec2(uv.x - uv.y * 0.57735026919, uv.y * 1.15470053838);
    vec2 cell = floor(skewed), f = fract(skewed);
    vec2 id0, id1, id2;
    vec3 weights;
    if (f.x + f.y <= 1.0) {
        id0 = cell;
        id1 = cell + vec2(1,0);
        id2 = cell + vec2(0,1);
        weights = vec3(1.0 - f.x - f.y, f.x, f.y);
    } else {
        id0 = cell + vec2(1,1);
        id1 = cell + vec2(0,1);
        id2 = cell + vec2(1,0);
        weights = vec3(f.x + f.y - 1.0, 1.0 - f.x, 1.0 - f.y);
    }
    weights = pow(max(weights, vec3(0.0)), vec3(3.0));
    weights /= max(dot(weights, vec3(1.0)), 0.000001);
    vec3 a = stochasticVertex(map, uv, dx, dy, id0);
    vec3 b = stochasticVertex(map, uv, dx, dy, id1);
    vec3 c = stochasticVertex(map, uv, dx, dy, id2);
    vec3 rgb = a * weights.x + b * weights.y + c * weights.z;
    // Corrección aproximada de la pérdida de contraste al promediar muestras.
    vec3 meanColor = textureLod(map, vec2(0.5), 20.0).rgb;
    return clamp(meanColor + (rgb - meanColor) * inversesqrt(dot(weights, weights)), 0.0, 1.0);
}

vec4 sampleVaried(sampler2D map, vec3 p, vec3 n, float meters) {
    float h = surfaceMicroHeight(p, meters);
    if (uTriplanar < 0.5) return vec4(sampleStochastic(map, p.xz / meters), h);
    vec3 blend = pow(abs(n), vec3(4.0));
    blend /= max(dot(blend, vec3(1.0)), 0.0001);
    vec3 rgb = sampleStochastic(map, p.yz / meters) * blend.x
             + sampleStochastic(map, p.xz / meters) * blend.y
             + sampleStochastic(map, p.xy / meters) * blend.z;
    return vec4(rgb, h);
}

float terrainDetailHeight(vec3 p, vec3 n, vec4 w);

vec3 terrainBumpNormal(vec3 p, vec3 n, vec4 w) {
    // Diferencias finitas en el plano tangente, con distancias en metros.
    // A diferencia de derivar la altura por pantalla, cada píxel obtiene
    // su propio gradiente; no compartimos el gradiente de un bloque 2x2.
    vec3 axis = abs(n.y) < 0.95 ? vec3(0,1,0) : vec3(0,0,1);
    vec3 tangent = normalize(cross(axis, n));
    vec3 bitangent = cross(n, tangent);
    float epsilon = 0.20;
    float ht = terrainDetailHeight(p + tangent * epsilon, n, w);
    float htBack = terrainDetailHeight(p - tangent * epsilon, n, w);
    float hb = terrainDetailHeight(p + bitangent * epsilon, n, w);
    float hbBack = terrainDetailHeight(p - bitangent * epsilon, n, w);
    // Congelamos los pesos durante el cálculo de las derivadas locales:
    // el relieve no introduce crestas artificiales en límites de máscaras.
    return normalize(n - tangent * ((ht - htBack) / (2.0 * epsilon))
                       - bitangent * ((hb - hbBack) / (2.0 * epsilon)));
}
`;

export const APPLY_COLOR = /* glsl */ `
vec3 terrainP = vTerrainPosition;
vec3 terrainN = terrainBaseNormal();
vec4 terrainW = max(terrainWeights(terrainP, terrainN), vec4(0.0));
terrainW /= max(dot(terrainW, vec4(1.0)), 0.0001);
vec3 terrainC = terrainAlbedo(terrainP, terrainN, terrainW);
#if TERRAIN_USE_MACRO
// Una lectura RGB: los pesos del material seleccionan la variación amplia.
// La nieve tiene ganancia 1; la escala del detalle y las máscaras no cambian.
vec3 terrainMacro = texture2D(uMacroMap, vTerrainMacroUv).rgb;
vec3 grassGain = mix(vec3(0.40,0.65,0.45), vec3(1.55,1.25,0.72), terrainMacro.r);
vec3 dirtGain = mix(vec3(0.52,0.46,0.40), vec3(1.60,1.30,1.00), terrainMacro.g);
vec3 rockGain = mix(vec3(0.52,0.65,0.86), vec3(1.50,1.20,0.82), terrainMacro.b);
vec3 terrainGain = grassGain * terrainW.x + dirtGain * terrainW.y + rockGain * terrainW.z + vec3(terrainW.w);
terrainC *= mix(vec3(1.0), terrainGain, uMacroEnabled * uMacroStrength);
#endif
diffuseColor.rgb = max(terrainC, vec3(0.0));
`;

export const APPLY_NORMAL = /* glsl */ `
normal = normalize(mat3(viewMatrix) * terrainBumpNormal(terrainP, terrainN, terrainW));
`;

export const APPLY_DIAGNOSTIC = /* glsl */ `
if (uView > 0.5 && uView < 1.5) {
    outgoingLight = terrainW.x * vec3(0.16, 0.60, 0.23)
                  + terrainW.y * vec3(0.65, 0.30, 0.08)
                  + terrainW.z * vec3(0.26, 0.32, 0.48)
                  + terrainW.w * vec3(0.95);
} else if (uView < 2.5 && uView > 1.5) {
    outgoingLight = vec3(1.0 - clamp(terrainN.y, 0.0, 1.0));
} else if (uView < 3.5 && uView > 2.5) {
    outgoingLight = vec3(fbm(terrainP * uNoiseScale));
} else if (uView < 4.5 && uView > 3.5) {
    outgoingLight = terrainC;
} else if (uView < 5.5 && uView > 4.5) {
    outgoingLight = terrainN * 0.5 + 0.5;
} else if (uView > 5.5) {
    outgoingLight = inverseTransformDirection(normal, viewMatrix) * 0.5 + 0.5;
}
`;
