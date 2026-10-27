import { Pane } from 'tweakpane';
import { MathUtils } from 'three';

const VIEW_OPTIONS = {
  'Material completo': 0, 'Pesos de materiales': 1, Pendiente: 2,
  'Ruido de distribución': 3, 'Color sin iluminación': 4,
  'Normal base': 5, 'Normal con detalle': 6,
};

export function createControls(container, lab, actions) {
  const state = {
    snow: lab.uniforms.uSnowHeight.value, slope: lab.uniforms.uRockSlope.value,
    noise: lab.uniforms.uNoiseAmount.value, patch: Math.round(1 / lab.uniforms.uNoiseScale.value),
    relief: lab.uniforms.uRelief.value, wind: Math.round(MathUtils.radToDeg(lab.uniforms.uWindAngle.value)),
    triplanar: Boolean(lab.uniforms.uTriplanar.value), sun: lab.sunAngle,
    sunElevation: lab.sunElevation,
    animateSun: false, view: 0, compare: false,
    macroEnabled: Boolean(lab.uniforms.uMacroEnabled.value), macroStrength: lab.uniforms.uMacroStrength.value,
    macroFrequency: lab.macroFrequency,
    snowDetail: lab.uniforms.uSnowDetail.value, snowBlend: lab.uniforms.uSnowBlend.value,
    snowMaxSlope: lab.uniforms.uSnowMaxSlope.value,
    shadows: lab.renderer.shadowMap.enabled,
    wireframe: false, wireOpacity: lab.wireframe.material.opacity,
    sunStrength: lab.sun.intensity, fillStrength: lab.fillLight.intensity,
    cameraMode: lab.cameraMode,
    droneSpeed: lab.drone.settings.speed, droneClearance: lab.drone.settings.clearance,
    dronePitch: lab.drone.settings.pitch, droneBanking: lab.drone.settings.banking,
    droneHeading: lab.drone.settings.heading, droneFov: lab.drone.settings.fov,
    dronePlaying: lab.drone.settings.playing,
  };
  const pane = new Pane({ container });
  const bindings = {};
  // Pestañas excluyentes para que el menú no necesite desplazamiento vertical.
  const tabs = pane.addTab({ pages: [{ title: 'Vista' }, { title: 'Material' }, { title: 'Iluminación' }] });
  const view = tabs.pages[0], material = tabs.pages[1], lighting = tabs.pages[2];
  const snow = material.addFolder({ title: 'Nieve', expanded: true });
  const distribution = material.addFolder({ title: 'Distribución', expanded: true });
  const surface = material.addFolder({ title: 'Superficie', expanded: true });

  function bind(parent, key, options, change) {
    const binding = parent.addBinding(state, key, options);
    binding.element.dataset.control = key;
    const input = binding.element.querySelector('input, select, button');
    if (input) input.setAttribute('aria-label', options.label);
    binding.on('change', (event) => { change(event.value); lab.invalidate(); });
    bindings[key] = binding;
    return binding;
  }

  function uniform(parent, key, name, options, transform = (value) => value) {
    return bind(parent, key, options, (value) => { lab.uniforms[name].value = transform(value); });
  }

  uniform(snow, 'snow', 'uSnowHeight', { label: 'Cota de nieve (m)', min: 60, max: 420, step: 1 });
  uniform(snow, 'snowMaxSlope', 'uSnowMaxSlope', { label: 'Pendiente máxima (°)', min: 1, max: 90, step: 1 });
  uniform(snow, 'snowBlend', 'uSnowBlend', { label: 'Suavidad del borde', min: 0.02, max: 3, step: 0.02 });
  uniform(snow, 'snowDetail', 'uSnowDetail', { label: 'Detalle nieve', min: 0, max: 2, step: 0.05 });
  uniform(distribution, 'slope', 'uRockSlope', { label: 'Umbral de roca', min: 0.08, max: 0.8, step: 0.01 });
  uniform(distribution, 'noise', 'uNoiseAmount', { label: 'Irregularidad', min: 0, max: 1.5, step: 0.01 });
  uniform(distribution, 'patch', 'uNoiseScale', { label: 'Manchas (m)', min: 20, max: 200, step: 1 }, (value) => 1 / value);
  uniform(distribution, 'wind', 'uWindAngle', { label: 'Viento (°)', min: 0, max: 360, step: 1 }, MathUtils.degToRad);
  uniform(surface, 'relief', 'uRelief', { label: 'Relieve', min: 0, max: 3, step: 0.1 });
  uniform(surface, 'triplanar', 'uTriplanar', { label: 'Triplanar' }, Number);
  uniform(surface, 'macroEnabled', 'uMacroEnabled', { label: 'Variación amplia' }, Number);
  uniform(surface, 'macroStrength', 'uMacroStrength', { label: 'Intensidad amplia', min: 0, max: 1.5, step: 0.01 });
  bind(surface, 'macroFrequency', { label: 'Frecuencia amplia (×)', min: 0.5, max: 3.5, step: 0.05 },
    (value) => lab.setMacroFrequency(value));
  bind(view, 'view', { label: 'Inspeccionar', options: VIEW_OPTIONS }, (value) => {
    lab.uniforms.uView.value = value;
    actions.inspect(value);
  });
  bind(view, 'compare', { label: 'Comparar' }, (value) => { lab.comparison = value; actions.compare(value); });
  bind(view, 'wireframe', { label: 'Wireframe superpuesto' }, (value) => {
    lab.setWireframe(value);
    bindings.wireOpacity.hidden = !value;
  });
  bind(view, 'wireOpacity', { label: 'Opacidad malla', min: 0.05, max: 0.9, step: 0.05 },
    (value) => { lab.wireframe.material.opacity = value; });
  bindings.wireOpacity.hidden = true;
  bind(lighting, 'sun', { label: 'Azimut (°)', min: 0, max: 360, step: 1 }, (value) => lab.setSun(value));
  bind(lighting, 'sunElevation', { label: 'Elevación (°)', min: 0, max: 90, step: 1 },
    (value) => lab.setSun(lab.sunAngle, value));
  bind(lighting, 'sunStrength', { label: 'Intensidad sol', min: 0, max: 6, step: 0.1 }, (value) => { lab.sun.intensity = value; });
  bind(lighting, 'fillStrength', { label: 'Luz de relleno', min: 0, max: 3, step: 0.05 }, (value) => { lab.fillLight.intensity = value; });
  bind(lighting, 'shadows', { label: 'Sombras' }, (value) => lab.setShadows(value));
  bind(lighting, 'animateSun', { label: 'Mover el sol' }, (value) => {
    lab.animateSun = value;
    bindings.sun.disabled = value;
    if (!value) { state.sun = Math.round(lab.sunAngle); bindings.sun.refresh(); }
  });
  const camera = view.addFolder({ title: 'Cámara', expanded: true });
  bind(camera, 'cameraMode', { label: 'Tipo de cámara', options: { Orbital: 'orbital', 'Dron · descenso': 'drone' } }, (value) => {
    lab.setCameraMode(value);
    orbital.hidden = value !== 'orbital';
    drone.hidden = value !== 'drone';
  });
  const orbital = camera.addFolder({ title: 'Orbital', expanded: true });
  orbital.addButton({ title: 'Acercar cámara' }).on('click', () => lab.closeCamera());
  orbital.addButton({ title: 'Restablecer cámara' }).on('click', () => lab.resetCamera());
  const drone = camera.addFolder({ title: 'Dron', expanded: true, hidden: true });
  function flight(key, setting, options) {
    bind(drone, key, options, (value) => lab.updateDrone(setting, value));
  }
  flight('dronePlaying', 'playing', { label: 'Reproducir vuelo' });
  flight('droneSpeed', 'speed', { label: 'Velocidad (m/s)', min: 1, max: 40, step: 0.5 });
  flight('droneClearance', 'clearance', { label: 'Altura sobre suelo (m)', min: 5, max: 100, step: 1 });
  flight('droneFov', 'fov', { label: 'FOV (°)', min: 45, max: 110, step: 1 });
  flight('dronePitch', 'pitch', { label: 'Mirada hacia abajo (°)', min: 10, max: 80, step: 1 });
  flight('droneBanking', 'banking', { label: 'Banking máximo (°)', min: 0, max: 30, step: 1 });
  flight('droneHeading', 'heading', { label: 'Rumbo de salida (°)', min: 0, max: 360, step: 1 });
  drone.addButton({ title: 'Reiniciar desde la cumbre' }).on('click', () => lab.restartDrone());
  lab.onDroneEnd = () => {
    state.dronePlaying = lab.drone.settings.playing;
    bindings.dronePlaying.refresh();
  };

  return {
    pane, bindings, state,
    setStage(stage) {
      bindings.noise.disabled = bindings.patch.disabled = stage === 0;
      bindings.relief.disabled = stage < 4;
      bindings.triplanar.disabled = stage < 2;
      bindings.macroEnabled.disabled = bindings.macroStrength.disabled = bindings.macroFrequency.disabled = stage < 3;
      bindings.snowDetail.disabled = stage < 2;
    },
    dispose: () => { lab.onDroneEnd = null; pane.dispose(); },
  };
}
