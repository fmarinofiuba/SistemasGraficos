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

    float S_val = sqrt(vLocalPosition.x * vLocalPosition.x + vLocalPosition.z * vLocalPosition.z);
    float V_val = vLocalPosition.y;

    // Discard fragments outside the HSV limits
    if (H_angle_deg < hMin || H_angle_deg > hMax ||
        S_val < sMin || S_val > sMax ||
        V_val < vMin || V_val > vMax) {
        discard;
    }

    vec3 hsv = vec3(H_angle_deg / 360.0, S_val, V_val);
    vec3 rgb = hsv2rgb(hsv);
    gl_FragColor = vec4(rgb, 1.0); // Use 0.7 for some transparency if needed
}
