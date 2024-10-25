export const fragmentShader = `
precision mediump float;

varying vec2 vUv;
uniform float time;

void main() {
    // Calcula la distancia desde el origen (0.0, 0.0) en el espacio UV
    float dist = length(vUv-0.5);

    // Aplica una onda senoidal que se expande con el tiempo
    float wave = sin(dist * 100.0 - time * 0.2);

    // Genera colores con la onda senoidal
    vec3 colorWave = vec3(0.5 + 0.5 * cos(6.28318 * wave), 
                          0.5 + 0.5 * sin(6.28318 * (wave + 0.5)), 
                          0.5 + 0.5 * cos(6.28318 * (wave + 1.0)));

    gl_FragColor = vec4(colorWave, 1.0);
}

    `;
