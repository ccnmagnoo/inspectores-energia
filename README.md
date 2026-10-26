# Detectives de la Energía

Juego web isométrico low-poly donde recorres cuatro lugares cotidianos buscando
cosas que gastan energía sin necesidad. Miras, tocas, decides y corriges: cada
acierto se convierte en **Puntos de Ahorro**.

Hecho con **Vite + TypeScript + Three.js**. Toda la geometría se genera por código:
no hay modelos, texturas ni audio externos.

---

## Arrancar el proyecto

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:5173/`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Comprueba los tipos (`tsc --noEmit`) y genera `dist/`. |
| `npm run preview` | Sirve la versión de producción de `dist/`. |

No hace falta configuración adicional: no hay backend, no hay variables de
entorno y el progreso se guarda en `localStorage`.

> Las tipografías (Baloo 2 y Nunito) se cargan desde Google Fonts. Si no hay
> conexión, el juego usa la tipografía del sistema y sigue funcionando igual.

---

## Cómo se juega

1. **Elige un lugar** en el menú. Los niveles se desbloquean en orden: al
   completar uno se abre el siguiente.
2. **Lee la tarjeta de entrada**: nombre del sitio, misión y una frase del
   detective.
3. **Explora**. Mueve el ratón (o el dedo) sobre la escena: lo que se puede
   inspeccionar se ilumina, muestra su nombre y un marcador flotante.
4. **Inspecciona** haciendo clic. Aparece una tarjeta con dos decisiones:
   - **Gasta de más** → el objeto es una ineficiencia.
   - **Está bien así** → el objeto está bien usado (señuelo).
5. **Corrige**. Si aciertas, el objeto se apaga, se cierra o se desconecta, salen
   partículas de energía y sube el medidor de Ahorro.
6. **Completa** el nivel encontrando todas las ineficiencias. Verás el resumen,
   las estrellas y las tarjetas-recuerdo.

### Controles

| Acción | Ratón / táctil | Teclado |
| --- | --- | --- |
| Resaltar objeto | pasar el cursor | `Tab` / flechas sobre la lista accesible |
| Inspeccionar | clic / tap | `Enter` o `Espacio` |
| Decidir | botones de la tarjeta | `1` = gasta de más, `2` = está bien así |
| Cerrar la tarjeta | clic en el fondo o “Mejor lo dejo para después” | `Esc` |
| Mover la vista | arrastrar | — |
| Zoom | rueda / pellizcar | — |

### Puntuación

- Acierto en una ineficiencia: **+100** Puntos de Ahorro.
- Acierto en un señuelo: **+100**.
- Racha: **+25** por acierto seguido, hasta **+75** extra.
- Error: **−25** y una pista amable. Nunca se pierde el nivel ni se bloquea nada.
- El marcador nunca baja de 0.

**Estrellas de Eficiencia**

| Estrellas | Requisito |
| --- | --- |
| ★★★ | Terminar sin errores |
| ★★ | Terminar con 1 o 2 errores |
| ★ | Terminar con 3 errores o más |

El nivel termina al encontrar **todas** las ineficiencias. Los señuelos son
opcionales: identificarlos bien suma puntos y demuestra que observaste de verdad.

### Pistas

Tienes **3 por nivel**. La pista hace brillar una zona *cercana* a una
ineficiencia sin resolver (no el objeto exacto) y acerca un poco la cámara.

---

## Los cuatro lugares

| # | Lugar | Dificultad | Ineficiencias | Señuelos |
| --- | --- | --- | --- | --- |
| 1 | La Vivienda | Tutorial | 6 | 2 |
| 2 | La Cafetería | Fácil | 6 | 3 |
| 3 | El Taller | Medio | 7 | 2 |
| 4 | El Restaurante | Difícil | 7 | 3 |

Cada escena tiene su propia geometría, su mobiliario y sus objetos
interactuables, pero comparte paleta, luz y nivel de detalle.

---

## Reglas de contenido

El juego **no usa unidades ni cifras técnicas** en ningún texto visible: nada de
kWh, vatios, potencia, facturas ni emisiones. La energía se comunica con
metáforas visuales (luz que se escapa, vapor, frío que sale de una puerta
abierta) y con **Puntos de Ahorro** como moneda abstracta.

Los conceptos son hábitos, no tecnología:

- “Luz encendida sin nadie”
- “Aparato dormido que sigue gastando”
- “Frío que se escapa”
- “Dos cosas que se pelean” (calefacción + ventilador)
- “Algo encendido que nadie está usando”

Nunca se culpa al jugador: el error solo resta puntos y devuelve una pista.

---

## Accesibilidad

- Todos los objetos interactuables tienen nombre accesible y aparecen en una
  lista navegable por teclado; al enfocar un elemento de la lista, la escena lo
  señala.
- Decisiones con teclado (`1` / `2`) y cierre con `Esc`.
- Estados distinguidos por icono, forma y texto, no solo por color.
- Contraste AA en textos y HUD.
- `prefers-reduced-motion`: se desactivan animaciones y transiciones no
  esenciales.
- El HUD es HTML sobre el canvas, así que respeta el zoom del navegador.
- Sonido silenciable con un botón persistente (se guarda en `localStorage`).

---

## Estructura del proyecto

```
.
├─ index.html               # canvas + capa de UI
├─ src/
│  ├─ main.ts               # arranque
│  ├─ style.css             # sistema visual completo (HUD, menú, tarjetas)
│  ├─ art/
│  │  ├─ palette.ts         # paleta única del juego
│  │  ├─ materials.ts       # caché de materiales y materiales mutables
│  │  ├─ props.ts           # primitivas, sala, muebles y decoración común
│  │  ├─ scenery.ts         # paisaje exterior: prado, montañas y árboles
│  │  ├─ home.ts            # objetos de la vivienda
│  │  ├─ cafe.ts            # objetos de la cafetería
│  │  ├─ tools.ts           # objetos del taller
│  │  └─ kitchen.ts         # objetos del restaurante
│  ├─ game/
│  │  ├─ Game.ts            # cámara, entrada, selección, puntaje, efectos
│  │  ├─ particles.ts       # confeti y chispas de energía
│  │  ├─ scoring.ts         # puntos, rachas y estrellas
│  │  ├─ storage.ts         # progreso en localStorage
│  │  ├─ audio.ts           # música y efectos con Web Audio API
│  │  └─ types.ts           # contratos (Finding, LevelDef, HUD…)
│  ├─ levels/
│  │  ├─ kit.ts             # ayudantes para montar una escena
│  │  ├─ home.ts
│  │  ├─ cafe.ts
│  │  ├─ workshop.ts
│  │  └─ restaurant.ts
│  └─ ui/
│     └─ app.ts             # pantallas, HUD, tarjetas, resumen
└─ tools/
   └─ shot.mjs              # capturas de QA vía Chrome DevTools Protocol
```

---

## Cómo agregar un nivel nuevo

Un nivel es un objeto `LevelDef` con una función `build()` que devuelve la
escena y la lista de hallazgos.

### 1. Crea `src/levels/miNivel.ts`

```ts
import { C } from '../art/palette';
import { plant, roomBase, tableTop } from '../art/props';
import type { LevelContent, LevelDef } from '../game/types';
import { makeKit } from './kit';

function build(): LevelContent {
  const k = makeKit();

  // 1. La sala: suelo, pared del fondo y pared izquierda.
  k.put(roomBase(12, 10, { floor: C.sand, wall: C.cream, trim: C.wood }), 0, 0, 0);

  // 2. Decoración que no se puede inspeccionar.
  k.put(tableTop(1.6, 0.9, 0.74, C.wood), -2, 0, 0);
  k.dev(plant(1, C.leaf), 4, 0, 3);

  // 3. Un objeto con ineficiencia.
  const lamp = k.dev(deskLamp(C.sun), -2, 0.78, 0);
  k.add(
    {
      id: 'mi-lampara',
      name: 'Lámpara de escritorio',
      isWaste: true,
      tip: 'Apagar la luz cuando sales del cuarto ahorra sin esfuerzo.',
      hint: 'Mira la lámpara: alumbra un escritorio vacío.',
    },
    lamp.group,
    () => lamp.set(false), // animación de corrección
  );

  // 4. Un señuelo: parece un problema, pero está bien usado.
  const radio = k.dev(radioPlaying(), 2, 0, -1);
  k.add(
    {
      id: 'mi-radio',
      name: 'Radio',
      isWaste: false,
      tip: 'La radio suena para alguien que la está escuchando.',
      hint: 'Hay música y una silla ocupada al lado.',
    },
    radio.group,
  );

  return k.content(12, 10);
}

export const miNivel: LevelDef = {
  id: 'mine',
  index: 4,
  name: 'Mi Lugar',
  place: 'Nombre del sitio',
  mission: 'Una frase corta que explique qué buscar.',
  greeting: '¡Hola, detective! ¿Me ayudas a encontrar las pistas?',
  accent: '#7fb8d9',
  difficulty: 2,
  wasteCount: 1,
  decoyCount: 1,
  size: { w: 12, d: 10 },
  build,
};
```

### 2. Reglas del `makeKit`

| Método | Uso |
| --- | --- |
| `k.put(obj, x, y, z, ry?)` | Añade decoración a la escena. |
| `k.dev(device, x, y, z, ry?)` | Añade un dispositivo y registra su `tick`. |
| `k.add(spec, object, fix?)` | Registra un hallazgo inspeccionable. |
| `k.content(w, d)` | Devuelve el `LevelContent` con el tamaño de la sala. |

Un **dispositivo** (`Device`) es `{ group, set(active), tick?(dt, t) }`, donde
`active = true` significa “encendido / con problema”. La animación de corrección
se pasa en `k.add(..., fix)` y normalmente es `() => device.set(false)`.

### 3. Regístralo en `src/ui/app.ts`

```ts
import { miNivel } from '../levels/miNivel';

const LEVELS: LevelDef[] = [homeLevel, cafeLevel, workshopLevel, restaurantLevel, miNivel];
```

Y añade una etiqueta de dificultad en `DIFFICULTY` si usas un valor nuevo.

### 4. Buenas prácticas

- **Entre 6 y 9 ineficiencias** y **2–3 señuelos** por escena.
- Todo debe verse sin ambigüedad: nada escondido detrás de geometría.
- Deja ~2 unidades libres alrededor de cada objeto interactuable para que el
  clic no se confunda con el vecino.
- Frases de máximo 90 caracteres, en segunda persona y sin culpa.
- Reutiliza los constructores de `src/art/*` antes de crear geometría nueva.
- Si un material va a cambiar en tiempo de ejecución (luces que se apagan), usa
  `matUnique`; `mat` devuelve materiales compartidos y **no deben mutarse**.
- Comprueba con `npx tsc --noEmit` y saca una captura con
  `node tools/shot.mjs "http://127.0.0.1:5173/?level=mine&play=1" shot-mine.png`.

---

## Notas de diseño

### Cámara

Proyección **ortográfica** con elevación de 32° y azimut de 45°, lo que da la
lectura isométrica 2:1 sin distorsión de perspectiva. No hay rotación libre: el
ángulo fijo garantiza que todas las pistas se lean igual. El paneo está limitado
al 28 % del tamaño de la sala y el zoom va de 0.85× a 2.4×.

### Luz y color

Una sola luz direccional cálida (sol de tarde) con sombra suave, más relleno frío
y ambiental. La paleta vive en `src/art/palette.ts` y es la única fuente de
color: crema, arena, madera y terracota como base; verde oliva y bosque para la
naturaleza; amarillo sol, coral, azul cielo y morado como acentos; naranja para
lo que desperdicia y verde menta para lo corregido.

Los materiales se cachean por combinación de parámetros. Eso mantiene el número
de programas de shader bajo y los 60 fps estables incluso con cientos de mallas.

### Paisaje exterior

Cada sala se apoya en un diorama de prado con colinas, cordilleras y árboles
generados por código en `src/art/scenery.ts`. El paisaje usa un generador
pseudoaleatorio con semilla derivada del tamaño de la sala, así que cada
escenario conserva su composición entre recargas. Las cordilleras se construyen
como siluetas verticales alineadas con la cámara isométrica: asoman por encima
de las paredes sin tapar la sala, los objetivos ni el HUD. Se puede desactivar
con `scenery: false` en las opciones de `roomBase`.

### Señuelos

Los señuelos son la parte pedagógica más importante: enseñan que no todo lo
encendido es un desperdicio. Siempre hay una prueba visual de que el objeto se
está usando (una taza humeante, un libro abierto, virutas frescas bajo el torno,
una puerta bien cerrada).

### Feedback

- Hover: anillo flotante + marcador en forma de rombo que oscila (sin tocar los
  materiales compartidos).
- Acierto: el objeto se corrige, salen chispas y sube el medidor.
- Error: pulso coral en el suelo y una pista concreta en el toast.
- Pista: onda expansiva a 1.6–2.8 unidades del objetivo + pequeño paneo.

---

## QA rápido

- `?level=home&play=1` abre un nivel directamente (útil para revisar escenas).
- `node tools/shot.mjs <url> <salida.png> [ancho] [alto] [esperaMs]` toma una
  captura con Edge headless vía CDP y muestra los errores de consola.
- Reiniciar progreso: enlace “Reiniciar progreso” al pie del menú, o borra la
  clave `detectives-energia:v1` de `localStorage`.

### Criterios de aceptación

- [x] 4 niveles jugables de principio a fin, cada uno con escena propia.
- [x] Estética low-poly isométrica coherente (paleta, luz y detalle comunes).
- [x] Bucle completo: explorar → inspeccionar → decidir → corregir → puntuar → resumen.
- [x] Puntuación con estrellas y progreso en `localStorage`.
- [x] Cero unidades técnicas en cualquier texto visible.
- [x] Textos en español neutro, cortos y amables.
- [x] Navegación por teclado y etiquetas accesibles.
- [x] `npm install && npm run dev` levanta el juego sin configuración extra.
- [x] Este README con cómo jugar, cómo agregar un nivel y notas de diseño.
