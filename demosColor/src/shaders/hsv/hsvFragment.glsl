uniform float hMin, hMax, sMin, sMax, vMin, vMax; // angles in degrees, rest 0-1
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

// HSV to RGB conversion function (Hue: 0-1, Sat: 0-1, Val: 0-1)
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Calculate HSV from vLocalPosition (which is mapped from cylinder geometry)
    // Cylinder: y is V, radius is S, angle is H
    float H_angle_rad = atan(vLocalPosition.z, vLocalPosition.x);
    float H_angle_deg = degrees(H_angle_rad);
    if (H_angle_deg < 0.0) H_angle_deg += 360.0;

    float current_S = sqrt(vLocalPosition.x * vLocalPosition.x + vLocalPosition.z * vLocalPosition.z); // Represents S in [0, sMax_uniform]
    float current_V = vLocalPosition.y; // Represents V in [vMin_uniform, vMax_uniform] due to JS geometry translation

    // Discard fragments outside the HSV limits defined by uniforms.
    // This handles the angular segment (hMin/hMax) and creates a tube if sMin > 0.
    // The geometry is built to sMax and [vMin, vMax], so current_S > sMax or current_V < vMin or current_V > vMax
    // should generally not occur for fragments on the geometry surface itself, but this ensures strict adherence.
    if (H_angle_deg < hMin || H_angle_deg > hMax ||
        current_S < sMin || current_S > sMax ||
        current_V < vMin || current_V > vMax) {
        //discard;
    }

    // For hsv2rgb, H should be [0,1], S and V are the actual saturation/value of the color [0,1].
    // current_S and current_V are these actual S and V components.
    vec3 hsv_color_components = vec3(H_angle_deg / 360.0, current_S, current_V);
    vec3 rgb = hsv2rgb(hsv_color_components);
    gl_FragColor = vec4(rgb, 1.0); // Use 0.7 for some transparency if needed
}
