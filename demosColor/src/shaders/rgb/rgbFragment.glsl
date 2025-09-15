varying vec3 vLocalPosition;
uniform float u_rMin, u_rMax, u_gMin, u_gMax, u_bMin, u_bMax;

void main() {
    float r_color = (vLocalPosition.x - u_rMin) / (u_rMax - u_rMin);
    float g_color = (vLocalPosition.y - u_gMin) / (u_gMax - u_gMin);
    float b_color = (vLocalPosition.z - u_bMin) / (u_bMax - u_bMin);
    
    gl_FragColor = vec4(clamp(r_color,0.0,1.0), clamp(g_color,0.0,1.0), clamp(b_color,0.0,1.0), 1.0);
}
