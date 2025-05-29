// HSL Fragment Shader

// varying vec3 v_position_world; // Removed as it's not used
varying vec3 v_hsl; // Interpolated HSL from vertex shader (h, s, l)

uniform float h_min;
uniform float h_max;
uniform float s_min;
uniform float s_max;
uniform float l_min;
uniform float l_max;

float calculateHueChannel(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

// Function to convert HSL to RGB
// h, s, l are in [0,1]
// Reference: https://www.cs.rit.edu/~ncs/color/t_convert.html (and many others)
vec3 hslToRgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float r, g, b;

    if (s == 0.0) {
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = calculateHueChannel(p, q, h + 1.0/3.0);
        g = calculateHueChannel(p, q, h);
        b = calculateHueChannel(p, q, h - 1.0/3.0);
    }
    return vec3(r, g, b);
}

void main() {
    // Discard fragments outside the HSL limits
    if (v_hsl.x < h_min || v_hsl.x > h_max ||
        v_hsl.y < s_min || v_hsl.y > s_max ||
        v_hsl.z < l_min || v_hsl.z > l_max) {
        discard;
    }

    // Convert HSL to RGB for display
    vec3 rgbColor = hslToRgb(v_hsl);

    gl_FragColor = vec4(rgbColor, 1.0); // Fully opaque
}
