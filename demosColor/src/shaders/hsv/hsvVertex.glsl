varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vLocalPosition = position; // Position in local coords (mapped from cylinder geometry)
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
