import * as THREE from 'three';

// Consulta la misma superficie triangular que se dibuja, no otra función de ruido.
export function terrainSampler(geometry) {
  const p = geometry.attributes.position;
  const side = Math.round(Math.sqrt(p.count));
  const cells = side - 1;
  const x0 = p.getX(0), z0 = p.getZ(0);
  const dx = p.getX(cells) - x0, dz = p.getZ(cells * side) - z0;
  return (x, z) => {
    const u = THREE.MathUtils.clamp((x - x0) / dx * cells, 0, cells);
    const v = THREE.MathUtils.clamp((z - z0) / dz * cells, 0, cells);
    const ix = Math.min(cells - 1, Math.floor(u)), iz = Math.min(cells - 1, Math.floor(v));
    const fx = u - ix, fz = v - iz, a = iz * side + ix;
    const h00 = p.getY(a), h10 = p.getY(a + 1), h01 = p.getY(a + side), h11 = p.getY(a + side + 1);
    return fx + fz <= 1
      ? h00 + (h10 - h00) * fx + (h01 - h00) * fz
      : h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  };
}

export class DroneFlight {
  constructor(geometry) {
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.3, 8000);
    this.settings = { speed: 8, clearance: 18, pitch: 35, banking: 12, heading: 35, fov: 75, playing: true };
    this.sampleHeight = terrainSampler(geometry);
    geometry.computeBoundingBox();
    this.bounds = geometry.boundingBox;
    const p = geometry.attributes.position;
    let peak = 0;
    for (let i = 1; i < p.count; i++) if (p.getY(i) > p.getY(peak)) peak = i;
    this.peak = new THREE.Vector3(p.getX(peak), p.getY(peak), p.getZ(peak));
    this.distance = 0;
    this.buildRoute();
    this.update(0, true);
  }

  buildRoute() {
    const angle = THREE.MathUtils.degToRad(this.settings.heading);
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x);
    const { min, max } = this.bounds;
    const limits = [];
    if (Math.abs(direction.x) > 1e-6) limits.push(((direction.x > 0 ? max.x - 55 : min.x + 55) - this.peak.x) / direction.x);
    if (Math.abs(direction.z) > 1e-6) limits.push(((direction.z > 0 ? max.z - 55 : min.z + 55) - this.peak.z) / direction.z);
    const extent = Math.min(...limits.filter((value) => value > 0));
    this.points = Array.from({ length: 601 }, (_, i) => {
      const t = i / 600;
      const point = this.peak.clone().addScaledVector(direction, extent * t)
        .addScaledVector(lateral, 30 * Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI));
      point.y = this.sampleHeight(point.x, point.z);
      return point;
    });
    // Envolvente suave: anticipa salientes, en lugar de saltar con cada triángulo.
    // Nunca baja de la superficie y limita la pendiente vertical de la ruta.
    for (const sign of [1, -1]) {
      for (let j = 1; j < this.points.length; j++) {
        const i = sign > 0 ? j : this.points.length - 1 - j;
        const a = this.points[i], b = this.points[i - sign];
        const horizontal = Math.hypot(a.x - b.x, a.z - b.z);
        a.y = Math.max(a.y, b.y - horizontal * 0.8);
      }
    }
    const heights = this.points.map((point) => point.y);
    this.points.forEach((point, i) => {
      let sum = 0;
      for (let offset = -8; offset <= 8; offset++) sum += heights[THREE.MathUtils.clamp(i + offset, 0, heights.length - 1)];
      point.y = Math.max(point.y, sum / 17);
    });
    this.lengths = [0];
    for (let i = 1; i < this.points.length; i++) this.lengths.push(this.lengths[i - 1] + this.points[i].distanceTo(this.points[i - 1]));
    this.length = this.lengths.at(-1);
    this.distance = Math.min(this.distance, this.length);
  }

  positionAt(distance) {
    const d = THREE.MathUtils.clamp(distance, 0, this.length);
    let low = 0, high = this.lengths.length - 1;
    while (low + 1 < high) {
      const middle = (low + high) >> 1;
      if (this.lengths[middle] <= d) low = middle; else high = middle;
    }
    const t = (d - this.lengths[low]) / Math.max(1e-6, this.lengths[high] - this.lengths[low]);
    const point = this.points[low].clone().lerp(this.points[high], t);
    // También protege el tramo interpolado entre muestras de la ruta.
    point.y = Math.max(point.y, this.sampleHeight(point.x, point.z)) + this.settings.clearance;
    return point;
  }

  restart() {
    this.distance = 0;
    this.settings.playing = true;
    this.update(0, true);
  }

  update(delta, snap = false) {
    if (this.settings.playing) this.distance = Math.min(this.length, this.distance + delta * this.settings.speed);
    const finished = this.distance >= this.length && this.settings.playing;
    if (finished) this.settings.playing = false;
    const position = this.positionAt(this.distance);
    const ahead = this.positionAt(Math.min(this.length, this.distance + 15));
    const behind = this.positionAt(Math.max(0, this.distance - 15));
    const forward = ahead.clone().sub(behind).setY(0).normalize();
    const pitch = THREE.MathUtils.degToRad(this.settings.pitch);
    const look = forward.clone().multiplyScalar(Math.cos(pitch)).setY(-Math.sin(pitch));
    const incoming = position.clone().sub(behind).setY(0).normalize();
    const outgoing = ahead.clone().sub(position).setY(0).normalize();
    const turn = incoming.x * outgoing.z - incoming.z * outgoing.x;
    const roll = THREE.MathUtils.degToRad(this.settings.banking) * THREE.MathUtils.clamp(-turn * 12, -1, 1);
    const orientation = new THREE.Matrix4().lookAt(position, position.clone().add(look), new THREE.Vector3(0, 1, 0));
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(orientation)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
    this.camera.position.copy(position);
    this.camera.quaternion.slerp(quaternion, snap ? 1 : 1 - Math.exp(-delta * 4));
    if (this.camera.fov !== this.settings.fov) {
      this.camera.fov = this.settings.fov;
      this.camera.updateProjectionMatrix();
    }
    return finished;
  }
}
