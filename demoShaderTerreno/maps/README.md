# Imágenes de terreno generadas con IA

Generadas con la herramienta integrada `image_gen.imagegen`. Las instrucciones completas están en [prompts.json](prompts.json).

| Archivo | Material | Resolución | Extensión base en el terreno |
| --- | --- | --- | --- |
| `grass-ai-v1.png` | Vegetación baja alpina | 1254 × 1254 | 4 × 4 m |
| `dirt-ai-v1.png` | Suelo mineral con grava fina | 1254 × 1254 | 3 × 3 m |
| `rock-ai-v1.png` | Granito expuesto y erosionado | 1254 × 1254 | 12 × 12 m |

Son mapas de color sRGB, solicitados como superficies seamless, con vista ortogonal e iluminación difusa uniforme. No contienen información de altura fiable ni son mapas normales. El shader genera un relieve fino independiente; no reconstruye las fracturas exactas visibles en la imagen.

Se conservaron las imágenes originales de la herramienta sin retoques. La resolución real entregada es 1254 × 1254, aunque los prompts pedían 1024 × 1024.

Revisión de bordes: diferencia absoluta media RGB (0–255) entre bordes opuestos, comparada con dos columnas vecinas interiores:

| Material | Borde horizontal | Borde vertical | Variación interior |
| --- | --- | --- | --- |
| Vegetación | 31,77 | 28,03 | 26,34 |
| Suelo | 22,99 | 22,60 | 20,20 |
| Roca | 26,40 | 28,21 | 24,87 |

Los saltos de borde son cercanos a la variación del propio grano. Esta comprobación tonal no garantiza por sí sola continuidad geométrica perfecta de cada hoja o fractura. La mezcla de rotaciones, desplazamientos y escalas del shader reduce además el reconocimiento del mosaico.

El ejemplo 03 muestra muestreo directo; 04 y 05 usan muestreo estocástico con tres transformaciones locales por proyección y un mapa macro RGB independiente. Ese mapa de datos se genera una sola vez con semillas fijas, cubre el terreno completo sin repetirse y modula la coloración por material. Las escalas del detalle son constantes e independientes del zoom.
