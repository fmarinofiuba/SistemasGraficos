# Terreno · Laboratorio de shaders

Demo independiente de Vite y **Three.js 0.186.1**, con GLSL editable inyectado en un `MeshPhongMaterial` mediante `onBeforeCompile`. No utiliza TSL ni modifica globalmente los shaders de Three.js.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+ y un navegador con WebGL 2.

```sh
npm install
npm run dev
```

Abrir la dirección que indique Vite en la consola (por defecto http://127.0.0.1:10002). Si ese puerto está ocupado, Vite elige el siguiente disponible. En Windows se pueden usar `install.bat`, `run_dev_server.bat` y `run_build.bat`.

```sh
npm test
npm run build
npm run preview
```

Pruebas de navegador aisladas (compilación WebGL real, errores GLSL, caché, controles, comparación y móvil):

```sh
npx playwright install chromium
npm run test:browser
```

Las capturas de verificación quedan en `test-results/`, excluido del repositorio.

Para verificar solo el muestreo con una carga gráfica mínima:

```sh
npm run test:sampler
```

La primera prueba dibuja superficies de 64 × 64 píxeles, sin sombras, animación ni editor. Comprueba la repetición, la continuidad del muestreo, la independencia del campo de normales respecto de las diagonales, el wireframe, el cambio tonal macro y el detalle de nieve. La segunda recoge cuatro capturas estáticas de 384 × 288, con sombras limitadas a 512² y sin animación. Usa un servidor temporal en el puerto 10012 y lo cierra junto con el navegador al terminar.

## Explorar

La aplicación abre el material completo. Los cinco ejemplos son acumulativos y se pueden seleccionar libremente:

1. **Distribución:** pesos de pasto, suelo, roca y nieve según altura, pendiente y viento.
2. **Transiciones:** ruido calculado en GPU que altera los límites sin máscaras pintadas.
3. **Detalle local:** imágenes seamless IA a escala fija, con proyección planar o triplanar.
4. **Variación:** muestreo estocástico local y un mapa macro independiente por material.
5. **Relieve:** microrelieve procedural independiente de las imágenes, conservando la normal base para distribuir materiales.

Editar el shader y esperar 650 ms o usar Ctrl+Enter. Un error conserva el último material válido; el registro del driver permite saltar a la línea del editor. Los borradores se guardan por ejemplo en el almacenamiento local del navegador. «Restaurar» recupera el código original del ejemplo actual. «↓ GLSL» descarga el fragmento editable; depende de los auxiliares de `shaderChunks.js`, no es un fragment shader autónomo.

El layout ocupa la ventana sin scroll general. La navegación mide 24 px y la única barra del editor, 28 px. Toda la interfaz, incluidos los estados y el resaltado del editor, usa exclusivamente grises. Los parámetros, vistas de inspección, comparación, cámara y guía están en el menú Tweakpane flotante de la esquina superior derecha. Las pestañas Material, Vista e Iluminación son su primer nivel, sin cabecera adicional. El fondo de la escena y la niebla usan un celeste poco saturado.

El editor ajusta las líneas al ancho y divide la vista en páginas según la altura disponible. Las flechas de su barra o Alt+RePág / Alt+AvPág cambian de página. El documento completo, la numeración global de líneas y el historial se conservan; la paginación no altera el código ni el archivo descargado. En pantallas angostas, el visor y el editor se reparten la altura de la ventana.

«Comparar» divide el mismo encuadre entre el ejemplo anterior original y el shader actual. Comparte parámetros, cámara e iluminación. En el primer ejemplo compara con un material uniforme.

En Vista, «Wireframe superpuesto» dibuja las aristas de los triángulos sobre el material final; «Opacidad malla» permite regularlas. No sustituye el material por un render de líneas. Iluminación contiene el azimut (0° en +X, 90° en +Z), la elevación (0° horizonte, 90° cenit), la intensidad del sol, la luz de relleno y la animación del azimut, que conserva la elevación elegida. En Material, «Detalle nieve» regula la variación fina de la nieve.

## Recursos y escala

Una unidad equivale a un metro. El terreno mide 1.200 × 1.200 m. La montaña se genera de manera determinista en CPU con una grilla de 384 × 384 segmentos (294.912 triángulos). Las pendientes se calculan sobre la grilla estructurada. Un campo de normales de 385 × 385, con componentes de 16 bits y unos 1,13 MiB, se reconstruye de forma bicúbica en el fragment shader. Así la máscara de nieve y la iluminación no dependen de la diagonal de cada celda. El campo normal suaviza el sombreado; la silueta sigue dependiendo de la geometría real, que se puede inspeccionar con wireframe.

Se cargan tres imágenes seamless de color sRGB de **1254 × 1254**, generadas con IA: vegetación baja (4 m por mosaico), suelo (3 m) y granito (12 m). Están en `maps/`, junto con los prompts completos, su procedencia y la revisión tonal de bordes. Son aproximadamente 24 MiB de textura GPU con mipmaps si se almacenan en RGBA8. La inicialización espera que las tres imágenes estén cargadas antes de aplicar el shader.

Los ejemplos 04 y 05 usan muestreo estocástico sobre una rejilla triangular. Cada vértice de la rejilla determina una rotación y un desplazamiento propios, a la misma escala física del detalle. Tres muestras locales se mezclan con pesos continuos; las celdas vecinas comparten las muestras de sus vértices. Los gradientes explícitos conservan una selección estable de mipmaps y hay una corrección aproximada de la pérdida de contraste de la mezcla. El ejemplo 03 conserva el mosaico directo como referencia didáctica.

La variación amplia usa un mapa macro RGB de 256 × 256, generado una sola vez al iniciar con semillas fijas. Ocupa 256 KiB, se interpreta como datos lineales y cubre el terreno una sola vez (`ClampToEdgeWrapping`). R, G y B contienen variaciones independientes de pasto, suelo y roca. Predominan extensiones de unos 180–520 m, con un nivel secundario de unos 90 m. Los controles no cambian las escalas del detalle fino.

La variación amplia se aplica al albedo antes de iluminarlo. Cada canal controla un par de multiplicadores RGB: vegetación verde/oliva seca, suelo oscuro/ocre y roca fría/cálida. Los pesos del material combinan esas ganancias y la nieve aporta ganancia 1. «Variación amplia» activa la capa y «Intensidad amplia» controla su fuerza entre 0 y 1,5, sin recompilar. Las reglas de distribución pueden seguir usando ruido; el mapa no modifica sus máscaras ni las normales.

La capa macro se integra en el material compartido y funciona también con los borradores de GLSL guardados. Está habilitada por etapa únicamente en 04 y 05, con configuración independiente para el material anterior al comparar. La composición reduce la repetición, sin prometer eliminarla por completo.

El relieve fino es procedural y no se deduce del brillo de las imágenes. No representa exactamente las fracturas o las hojas de los mapas de color. Se eliminó el antiguo patrón celular regular de la roca. Para compatibilidad con borradores guardados, los auxiliares `sampleSurface` y `sampleVaried` siguen devolviendo en A una altura procedural independiente; los PNG solo aportan color.

Los borradores de shader previos se conservan. Para cargar el nuevo ejemplo de microrelieve, seleccionar 05 y pulsar «Restaurar»; eso reemplaza el código del ejemplo actual, por lo que conviene descargar antes un borrador propio si se desea conservarlo.

Se eliminaron las fórmulas sinusoidales por altura que introducían bandas en la roca. Al cargar un borrador, `shaderMigration.js` retira únicamente las fórmulas conocidas que traía la demo, conservando el resto de las ediciones. Antes de la primera corrección se guarda una copia en `terrain-shader-lab-v1-before-banding-fix` dentro del almacenamiento local del navegador. No hace falta restaurar el ejemplo para corregir esas bandas.

Las escalas del detalle permanecen fijas al usar los controles. «Tamaño de manchas» modifica solo la distribución de materiales. La cámara controla el zoom. Los valores de escala están visibles en el shader y se pueden editar como ejercicio avanzado.

La iluminación y sombras son las de Three.js (Blinn-Phong), con intensidad inicial del sol 4 y relleno 0,8. La altura fina perturba la normal mediante diferencias centrales en el plano tangente, tomando muestras a ±0,20 m. No desplaza vértices, no modifica la silueta ni produce autosombras de microdetalle. Los pesos se mantienen constantes durante ese cálculo para evitar crestas artificiales en los límites de materiales. La nieve tiene variación fina de color y altura; las frecuencias que no puede resolver el píxel se atenúan según la cámara para evitar aliasing. Las fórmulas antiguas de nieve incluidas en la demo se migran automáticamente, conservando colores personalizados.

## Código

| Archivo | Responsabilidad |
| --- | --- |
| `src/main.js` | Interfaz, controles, ejemplos, borradores y compilación |
| `src/editor.js` | Editor CodeMirror con sintaxis tipo C/GLSL y Ctrl+Enter |
| `src/controls.js` | Menú Tweakpane flotante: material, inspección, comparación, luz y cámara |
| `src/presets.js` | Código GLSL visible y progresión didáctica |
| `src/terrainMaterial.js` | Integración localizada con los chunks de Three.js y clave de caché |
| `src/shaderChunks.js` | Ruido, muestreo, proyección, bump y vistas de inspección |
| `src/textures.js` | Carga de las tres imágenes IA y configuración de muestreo y color |
| `src/macroVariation.js` | Generación única del mapa RGB de variación amplia por material |
| `src/shaderMigration.js` | Corrección de las bandas heredadas en borradores, preservando ediciones |
| `maps/` | PNG originales generados con IA, prompts y revisión de bordes |
| `src/noise.js` | Ruido determinista y periódico en CPU |
| `src/terrain.js` | Malla de elevación y paredes de la base |
| `src/terrainNormals.js` | Campo de normales independiente de la triangulación, en precisión de 16 bits |
| `src/scene.js` | Cámara, luz, render, comparación y validación de materiales |

Los puntos de inyección son `common`, `begin_vertex`, `map_fragment`, `normal_fragment_maps`, `opaque_fragment` y `tonemapping_fragment`. La versión está fijada; las pruebas comprueban que los marcadores existen al actualizar Three.js.

Funciones editables:

```glsl
vec4 terrainWeights(vec3 p, vec3 n);
vec3 terrainAlbedo(vec3 p, vec3 n, vec4 w);
float terrainDetailHeight(vec3 p, vec3 n, vec4 w);
```

El editor cambia código GLSL, no ejecuta JavaScript. El material candidato se dibuja en un render target pequeño para validar la compilación GPU antes de reemplazar el último material válido. Los sliders actualizan uniforms sin recompilar.

En desarrollo, `window.terrainLab` expone el laboratorio para inspección y pruebas de compilación. No se publica en el build de producción.
