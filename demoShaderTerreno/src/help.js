const TOPICS = [
  {
    label: 'General', title: 'Un terreno, cinco capas de complejidad',
    paragraphs: [
      'Esta aplicación explora cómo un material personalizado puede dar variedad y detalle a un terreno sin pintar máscaras a mano ni usar una única textura enorme. El shader decide dónde aparecen pasto, suelo, roca y nieve a partir de la forma del terreno y combina sus superficies.',
      'Los cinco pasos son acumulativos: cada uno incorpora un recurso al anterior. Podés abrirlos en cualquier orden. El editor muestra las reglas del material y permite modificarlas en vivo; Three.js conserva la iluminación Phong y las sombras. El microrelieve cambia la respuesta a la luz, pero no agrega geometría ni modifica la silueta.',
      'Usá este índice para conocer qué incorpora cada paso. Consultar la ayuda no cambia la etapa activa ni tus ediciones. En Vista podés inspeccionar las máscaras, el color y las normales, superponer la malla o comparar: a la izquierda aparece el paso anterior original y a la derecha tu material actual.',
      'Arrastrá para orbitar, usá la rueda para acercar y el botón derecho para desplazar. En vivo aplica tus cambios tras una pausa; Ctrl+Enter los aplica inmediatamente. Un error conserva el último material válido. Restaurar recupera el ejemplo de la etapa y ↓ GLSL descarga su código editable. Las flechas del editor recorren el archivo completo.',
      'Vista → Cámara permite alternar entre la orbital y un dron que parte de la cumbre y vuela hacia el exterior siguiendo el relieve. Podés pausar, reiniciar y ajustar su velocidad, altura sobre el suelo, FOV, mirada hacia abajo y banking en las curvas. El rumbo de salida crea un nuevo recorrido desde la cumbre; al llegar al final, el vuelo se detiene. Volver a Orbital recupera tu encuadre. La tecla H oculta o muestra el menú cuando no estás escribiendo.',
    ],
  },
  {
    label: '01 Distribución', title: '01 · Elegir materiales según el terreno',
    paragraphs: [
      'El punto de partida usa colores planos para mostrar la distribución de los cuatro materiales. La altura permite acumular nieve en las zonas altas, la pendiente descubre roca en las laderas y la orientación respecto del viento ayuda a distribuir el suelo y el pasto.',
      'Cada punto recibe una mezcla de materiales, con prioridad para la nieve. Todavía no hay imágenes ni microrelieve: el objetivo es entender las reglas de composición sin que el detalle superficial las oculte. La suavidad del borde de nieve regula cuánto se mezclan las superficies en sus límites.',
      'Probá cambiar la cota de nieve, su suavidad y el umbral de roca. En Vista → Pesos de materiales podés reconocer las regiones que decide el shader. La iluminación ya está presente; no es un efecto que se agregue recién en el último paso.',
    ],
  },
  {
    label: '02 Transiciones', title: '02 · Romper la regularidad de las fronteras',
    paragraphs: [
      'Se incorpora ruido procedural a las reglas de distribución. Las fronteras dejan de depender solamente de una altura o una inclinación y adquieren manchas e irregularidades relacionadas con la posición sobre el terreno.',
      'El ruido modifica las máscaras, no la malla. Los colores siguen siendo planos para que puedas concentrarte en cómo se separan y mezclan los materiales. La escala de las manchas controla extensiones de distribución, no el tamaño del grano de una textura.',
      'Llevá Irregularidad a cero para recuperar los límites regulares y luego aumentala. Cambiá Manchas (m) y observá Ruido de distribución o compará con 01 para identificar exactamente lo que aporta esta capa.',
    ],
  },
  {
    label: '03 Detalle local', title: '03 · Dar una superficie a cada región',
    paragraphs: [
      'Se incorporan tres imágenes seamless pequeñas para el color del pasto, del suelo y de la roca. La nieve recibe detalle procedural. Las máscaras del paso anterior deciden cómo combinar estos materiales, sin necesidad de una imagen de distribución pintada a mano.',
      'Las imágenes se repiten a una escala fija en metros: acercar la cámara permite ver más detalle sin agrandar el pasto o la piedra. La proyección triplanar combina proyecciones sobre tres ejes para reducir el estiramiento en paredes inclinadas.',
      'Acercate a una ladera y alterná Triplanar. Este paso conserva la repetición directa de las imágenes como referencia: que una textura sea seamless evita una costura, pero no elimina la repetición visible del mosaico. El relieve fino todavía no perturba la iluminación.',
    ],
  },
  {
    label: '04 Variación', title: '04 · Variar el conjunto sin perder el detalle',
    paragraphs: [
      'Se incorpora muestreo estocástico: las imágenes se consultan con desplazamientos y rotaciones locales y se mezclan de forma continua. Esto reduce el reconocimiento del mosaico conservando la escala física de los detalles.',
      'Además, un mapa de baja frecuencia introduce cambios amplios de tono e intensidad, distintos para pasto, suelo y roca. Esta capa actúa sobre extensiones grandes, mientras las imágenes siguen aportando el grano fino. No representa sombras: la variación de color pertenece al material y permanece al mover el sol.',
      'Alterná Variación amplia y regulá Intensidad amplia. Compará con 03 y mirá Color sin iluminación para distinguir las variaciones del material de las provocadas por la luz. La combinación reduce la uniformidad y la repetición, aunque no garantiza que todo patrón resulte imperceptible.',
    ],
  },
  {
    label: '05 Relieve', title: '05 · Hacer que el detalle responda a la luz',
    paragraphs: [
      'Se incorpora una altura procedural fina diferente para cada superficie. A partir de sus variaciones se perturba la normal usada en la iluminación: la roca, el suelo, el pasto y la nieve reaccionan a la dirección del sol como superficies con pequeños relieves.',
      'Este detalle es independiente del brillo de las imágenes. La normal base sigue decidiendo las máscaras, por lo que el grano fino no altera dónde se acumula la nieve o aparece la roca. La malla y su silueta permanecen iguales; el wireframe permite comprobarlo.',
      'Regulá Relieve y Detalle nieve, alterná Normal base y Normal con detalle y mové el azimut o la elevación del sol en Iluminación. Compará con 04 para separar el aporte de las variaciones de color del nuevo efecto sobre la luz.',
    ],
  },
];

export const HELP_MARKUP = `<dialog id="help-dialog" aria-labelledby="help-title">
  <header class="help-header"><h2 id="help-title">Ayuda del laboratorio</h2><button id="close-help" aria-label="Cerrar ayuda">×</button></header>
  <nav class="help-index" aria-label="Índice de la ayuda">${TOPICS.map((topic, i) => `<button data-help-topic="${i}" aria-controls="help-content" aria-current="${i === 0 ? 'page' : 'false'}">${topic.label}</button>`).join('')}</nav>
  <article id="help-content" tabindex="0"></article>
</dialog>`;

export function setupHelp() {
  const dialog = document.querySelector('#help-dialog');
  const content = dialog.querySelector('#help-content');
  const buttons = [...dialog.querySelectorAll('[data-help-topic]')];
  function select(index) {
    const topic = TOPICS[index];
    buttons.forEach((button, i) => button.setAttribute('aria-current', i === index ? 'page' : 'false'));
    content.innerHTML = `<h3>${topic.title}</h3>${topic.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}`;
    content.scrollTop = 0;
  }
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  document.querySelector('#open-help').addEventListener('click', () => { select(0); dialog.showModal(); });
  dialog.querySelector('#close-help').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  select(0);
}
