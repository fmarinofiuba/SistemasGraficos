// HSL Vertex Shader

varying vec3 v_hsl;          // Calculated HSL value at this vertex

// modelMatrix, projectionMatrix, modelViewMatrix, and position are provided by Three.js

const float PI = 3.14159265359;

void main() {
    // Calculate world position locally. 
    // The cone geometries in HSLColorSpace.js are set up such that their local Y
    // (after appropriate translation/rotation) directly maps to Lightness (0 to 1).
    // The modelMatrix here will transform these local vertex positions into world space.
    // However, the HSL calculation should be based on the intended conceptual model where
    // Y is lightness (0-1), and XZ plane at a given Y defines hue/saturation.
    // The setup in HSLColorSpace.js for the two cones ensures that 'position.y' in the shader
    // for the bottom cone goes 0 (tip) to 0.5 (base) and for the top cone (after rotation)
    // effectively 0.5 (base) to 1 (tip) if we consider a unified 0-1 L axis.

    // For the HSL model, the 'position' attribute of the ConeGeometry is already set up
    // such that y directly corresponds to Lightness (0->0.5 for bottom cone, 0.5->1 for top cone after transformations).
    // x and z give the hue/saturation plane.
    // The 'modelMatrix' transforms these local positions to world space, but for HSL derivation,
    // we should use the coordinates that directly map to H, S, L within the double-cone model.
    // The way the cones are constructed and positioned in HSLColorSpace.js:
    // - Bottom cone: position.y goes from 0 (tip) to 0.5 (base).
    // - Top cone: position.y (in its local space, before rotation) goes from 0 (tip) to 0.5 (base).
    // After rotation and positioning, its effective world Y will go from 1 (tip) down to 0.5 (base).
    // The shader receives 'position' in the local space of each mesh.

    // Let's assume 'position' given to the shader is already in the canonical HSL space
    // where y is L (0-1), and x,z are for H,S relative to the L axis.
    // This relies on HSLColorSpace.js correctly setting up the two cones.
    // Bottom cone: y from 0 to 0.5. Top cone: y from 0.5 to 1.
    // The shader material is shared, so 'position' will be from each cone's local geometry.
    // We need a consistent L value across both cones.
    // The `modelMatrix` and then `actual_world_pos` is the key to get a consistent coordinate system.

    vec4 worldPos_temp = modelMatrix * vec4(position, 1.0);
    vec3 actual_world_pos = worldPos_temp.xyz / worldPos_temp.w;

    // L (Lightness) is directly the y-coordinate of the world position (0 to 1)
    // This assumes the HSLColorSpace positions the cones correctly in world space from Y=0 to Y=1.
    float l = actual_world_pos.y;

    // S (Saturation) calculation based on world position
    // Max saturation (cone radius 0.5 at world origin) occurs at L=0.5.
    // Saturation is 0 at L=0 and L=1.
    // The radius of the cone at a given lightness 'l'.
    float radius_at_l;
    if (l < 0.5) {
        radius_at_l = l; // Radius = 0 at l=0, Radius = 0.5 at l=0.5
    } else {
        radius_at_l = 1.0 - l; // Radius = 0.5 at l=0.5, Radius = 0 at l=1
    }
    // radius_at_l now represents the max possible radius (saturation=1) at this lightness.

    float s = 0.0;
    // Distance of the current point from the central L-axis in the XZ plane
    float dist_from_L_axis = length(vec2(actual_world_pos.x, actual_world_pos.z));

    if (radius_at_l > 0.0001) { // Avoid division by zero if radius is effectively zero (at L=0 or L=1)
        s = dist_from_L_axis / radius_at_l;
        s = clamp(s, 0.0, 1.0);
    } else { // This means l is very close to 0 or 1.
        // If dist_from_L_axis is also very small, it's achromatic (s=0).
        // Otherwise, it might be a slight imprecision, but saturation should be 0 at tips.
        s = 0.0;
    }

    // H (Hue) is the angle in the XZ plane.
    // atan(y, x) equivalent for GLSL. Result is from -PI to PI.
    float h_angle = atan(actual_world_pos.z, actual_world_pos.x);
    float h = h_angle / (2.0 * PI); // Normalize to -0.5 to 0.5
    if (h < 0.0) {
        h += 1.0; // Shift to 0.0 to 1.0
    }
    // If saturation is very low, hue is undefined. We can set it to 0.
    if (s < 0.001) {
        h = 0.0;
    }

    v_hsl = vec3(h, s, l);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
