varying vec3 vLocalPosition;
uniform float u_cMin, u_cMax, u_mMin, u_mMax, u_yMin, u_yMax;

void main() {
    float c = (vLocalPosition.x - u_cMin) / (u_cMax - u_cMin);
    float m = (vLocalPosition.y - u_mMin) / (u_mMax - u_mMin);
    float y = (vLocalPosition.z - u_yMin) / (u_yMax - u_yMin);
    
    // Convert CMY to RGB
    float r = 1.0 - c;
    float g = 1.0 - m;
    float b = 1.0 - y;

    gl_FragColor = vec4(clamp(r,0.0,1.0), clamp(g,0.0,1.0), clamp(b,0.0,1.0), 1.0);
}
