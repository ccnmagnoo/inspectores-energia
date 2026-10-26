# Prompt — Juego web "Detectives de la Energía"

> Copia y pega este documento completo como instrucción para el agente/desarrollador que construirá el juego.

---

## 1. Rol y objetivo

Actúa como **diseñador de videojuegos + desarrollador front-end senior**. Tu tarea es diseñar y construir un **juego web jugable, completo y pulido** llamado provisionalmente **"Detectives de la Energía"** (`Energy Detectives`).

El juego enseña, mediante la exploración y la observación, a **identificar ineficiencias energéticas** en entornos cotidianos. El jugador recorre una escena en **estilo low-poly isométrico**, inspecciona artefactos y decide si están **bien usados** o **desperdiciando energía**.

**La prioridad es la claridad y el disfrute**, no el rigor técnico: el juego debe ser comprensible para **niños desde ~8 años y adultos sin conocimientos técnicos**.

---

## 2. Público objetivo

- Niños y niñas de 8 a 14 años (público principal).
- Familias y docentes que lo usan como material de aula.
- Público general adulto en campañas de concientización.

**Implicaciones de diseño:**
- Sin texto denso. Frases cortas, máximo 2 líneas por mensaje.
- Sin tecnicismos ni unidades físicas (ver sección 6).
- Colores vivos, formas reconocibles, personajes/objetos entrañables.
- Nada de castigos duros: el error debe enseñar, no frustrar.

---

## 3. Concepto y fantasía de jugador

> "Eres un detective de la energía. Entras a un lugar y tu misión es encontrar todo lo que está gastando energía sin necesidad. Cada pista que encuentras se convierte en ahorro."

El jugador **no repara aparatos ni instala tecnología**: solo **observa, detecta y corrige hábitos**. La corrección es simbólica (un clic, un interruptor, un gesto) y siempre produce una animación satisfactoria de "energía recuperada".

---

## 4. Estilo visual — low-poly isométrico

Este es el pilar estético del juego. Debe verse **hermoso, cálido y coherente**, como una maqueta de juguete iluminada.

### 4.1 Cámara y perspectiva
- **Proyección isométrica verdadera** (2:1, sin perspectiva). Sin rotación libre de cámara: ángulo fijo para garantizar legibilidad.
- Vista **diagonal superior** (~30° de inclinación), como una casa de muñecas abierta por dos paredes.
- Permitir **zoom suave** (2–3 niveles) y **paneo limitado** dentro de los bordes de la escena.
- Las paredes del fondo y del lado izquierdo existen; las frontales se omiten para ver el interior ("cutaway").

### 4.2 Geometría low-poly
- Mallas con **pocos polígonos y caras planas** (`flatShading: true`), sin suavizado.
- Volúmenes simples y legibles: cubos, cilindros de pocos lados, prismas biselados.
- **Sin texturas fotorrealistas.** Color plano por material + detalles geométricos mínimos.
- Bordes ligeramente biselados para que la luz los lea bien.

### 4.3 Paleta y luz
- Paleta **cálida y terrosa** con acentos saturados:
  - Base: crema `#F6E7D3`, arena `#E4C9A8`, madera `#B4794A`, terracota `#D2703F`
  - Naturaleza: verde oliva `#7C9C5A`, verde bosque `#3F6B4A`
  - Acentos: amarillo sol `#FFC94D`, coral `#EF6A5B`, azul cielo `#7FB8D9`, morado suave `#9B7FB5`
  - Peligro/desperdicio: naranja `#FF8A3D` con pulso
  - Correcto/ahorro: verde menta `#5FD3A3`
- **Una sola luz direccional cálida** (como sol de tarde) + luz ambiental suave + **sombra proyectada suave** sobre el suelo.
- Sombras **blandas y algo exageradas** para dar profundidad de maqueta.
- Post-procesado sutil: vignette ligero, bloom muy leve, sin motion blur.

### 4.4 Detalle y "vida"
- Objetos con micro-animaciones en reposo: plantas que se mecen, vapor de la cafetera, cursor de luz parpadeando, ventilador girando, cortina moviéndose.
- Partículas discretas: polvo en el aire, hojas, vapor, chispas de "energía" al corregir.
- Al seleccionar un objeto, se eleva ligeramente y aparece un **contorno/foco** (outline o glow) que lo hace inconfundible.

### 4.5 Referencias de tono
Piensa en la calidez de *Monument Valley*, la claridad de *Alto's Odyssey* y la jugabilidad de "buscar objetos" tipo *Hidden Folks*, pero en 3D isométrico low-poly.

---

## 5. Entornos jugables

Cada entorno es un **nivel independiente** con su propia escena isométrica, conjunto de ineficiencias y dificultad.

| # | Entorno | Dificultad | Ineficiencias (ejemplos) |
|---|---------|-----------|--------------------------|
| 1 | **Vivienda** (sala, cocina, dormitorio) | Tutorial | Luz encendida en cuarto vacío · TV en *standby* · cargador conectado sin celular · refrigerador abierto · aire acondicionado con ventana abierta · ducha larga |
| 2 | **Cafetería** | Fácil | Cafetera encendida sin taza · vitrina refrigerada abierta · luces encendidas de día · ventilador y calefacción a la vez · equipo conectado sin uso |
| 3 | **Taller** | Medio | Compresor con fuga de aire · soldadora enchufada sin usar · luces industriales encendidas sin gente · taladro cargando desde ayer · puerta abierta con extractor encendido |
| 4 | **Restaurante** | Difícil | Horno al máximo sin comida · cámara frigorífica con puerta mal cerrada · lavaplatos a media carga · letrero luminoso de día · campana extractora encendida sin cocinar |

**Reglas de contenido por nivel:**
- Entre **6 y 9 ineficiencias** por escena.
- Incluir **2–3 "señuelos"**: objetos que *parecen* un problema pero están bien usados (ej.: refrigerador cerrado y funcionando, lámpara LED encendida donde hay gente). Enseñan a observar, no a adivinar.
- Todas las ineficiencias deben ser **visibles sin ambigüedad** en la escena (nada oculto tras geometría).
- Cada nivel tiene un **nombre y una misión breve** en una tarjeta de entrada.

---

## 6. Reglas de contenido energético — SIMPLE, SIN UNIDADES

### 6.1 Prohibido en toda la interfaz y el texto
- ❌ kWh, W, vatios, amperios, voltaje, potencia, consumo eléctrico medido, huella de CO₂ en cifras, facturas con montos.
- ❌ Fórmulas, porcentajes técnicos, comparativas de eficiencia energética clase A/B/C.

### 6.2 Permitido y preferido
- ✅ **"Puntos de Ahorro"** (unidades abstractas, como monedas).
- ✅ **"Energía que se escapaba"** representada como una **barra o un chorro de luz** que se apaga.
- ✅ Conceptos-hábito, siempre en lenguaje natural:
  - "Luz encendida sin nadie"
  - "Aparato dormido que sigue gastando" (modo espera, sin nombrarlo técnicamente)
  - "Frío que se escapa"
  - "Calor que se va por la ventana"
  - "Agua caliente de más"
  - "Algo encendido que nadie está usando"
  - "Dos cosas que se pelean" (calefacción + ventilador, por ejemplo)
- ✅ Metáforas visuales: **gotas de energía**, **humo de desperdicio**, **bombillas que se apagan**, **flechas de frío escapándose**.

### 6.3 Escala de recompensa
- Cada acierto: **+100 Puntos de Ahorro** (+ bonus de racha).
- Cada señalado incorrecto: **−25** y una pista amable (nunca bloqueo).
- Al terminar: **1 a 3 "Estrellas de Eficiencia"** según puntos y errores.

---

## 7. Bucle de juego (gameplay loop)

1. **Entrada al nivel** — tarjeta con nombre del lugar, misión y un personaje guía que dice una frase.
2. **Explorar** — el jugador mueve la mirada/paneo y hace hover sobre objetos; los interactuables se iluminan suavemente.
3. **Inspeccionar** — clic en un objeto: se acerca, se eleva y aparece un **globo de diálogo** con una frase corta y una decisión:
   - *"Esto está gastando energía sin necesidad"* → **Marcar como ineficiencia**
   - *"Esto está bien usado"* → **Dejar pasar**
4. **Resolver** — si acierta, animación de corrección (se apaga la luz, se cierra la puerta, se desconecta el cable) + partículas de energía que vuelan al medidor + **+puntos** + micro-tip educativo de una línea.
5. **Progreso** — un **medidor de Ahorro** sube de 0 a 100%; al llenarse, el nivel termina con celebración (confeti low-poly, sonido alegre, estrellas).
6. **Resumen del nivel** — lista de lo encontrado con su frase-hábito, puntaje, estrellas y botón "Siguiente lugar" / "Repetir".

**Duración objetivo por nivel:** 3–5 minutos. **Sesión total:** 10–15 minutos.

---

## 8. Interacción y controles

- **Ratón:** hover = resaltado; clic = inspeccionar; clic en fondo = cerrar.
- **Teclado:** `Tab`/flechas para recorrer objetos interactuables, `Enter`/`Espacio` para inspeccionar, `Esc` para cerrar.
- **Táctil:** tap para inspeccionar, arrastrar con un dedo para panear, pellizcar para zoom.
- **Sin acción con tiempo límite** (opcional en modo "Reto", nunca en modo normal).
- Zonas de clic generosas (mínimo ~44 px en pantalla) y cursor `pointer` en objetos interactuables.

---

## 9. Interfaz (HUD)

- **Arriba izquierda:** nombre del lugar + contador `Ineficiencias encontradas: 3 / 7`.
- **Arriba derecha:** medidor circular o barra de **Ahorro** con icono de hoja/bombilla.
- **Abajo centro:** botón **"Pista"** (máx. 3, muestra un pulso sobre una zona, no el objeto exacto).
- **Abajo derecha:** botones de sonido y reinicio.
- **Estilo del HUD:** minimalista, esquinas redondeadas, tipografía redondeada (ej. *Baloo 2*, *Nunito*, *Fredoka*), fondo semitransparente color crema. Sin barras de datos técnicos.
- Todo el HUD debe ser **legible sobre la escena** (contraste y sombra suave).

---

## 10. Educación integrada (sin sermones)

- Cada acierto entrega **una frase-hábito de máximo 90 caracteres**, por ejemplo:
  - "Apagar la luz al salir ahorra sin esfuerzo."
  - "Un aparato en espera sigue gastando aunque no lo veas."
  - "Si el aire acondicionado está encendido, la ventana debe estar cerrada."
  - "Un cargador conectado sin celular sigue consumiendo."
  - "Descongelar bien el refrigerador lo hace trabajar menos."
- Al final del nivel: **3 tarjetas-recuerdo** con los hábitos más importantes.
- Tono: **cercano, positivo, sin culpa**. Nunca "estás mal"; siempre "puedes hacerlo mejor".

---

## 11. Sonido y música

- Música **acústica ligera y cálida** (ukelele, marimba, pizzicato), en loop, volumen bajo.
- Efectos: *pop* al inspeccionar, *clic* de interruptor, *campanita* de acierto, *boing* suave de error, *whoosh* de energía recuperada, fanfarria breve al completar.
- Todo debe poder silenciarse (botón persistente) y respetar `prefers-reduced-motion` para animaciones no esenciales.
- Recursos de audio generados por **Web Audio API** o archivos cortos incluidos (sin dependencias externas en tiempo de ejecución).

---

## 12. Accesibilidad

- Contraste mínimo AA en textos y HUD.
- Todos los objetos interactuables tienen **nombre accesible** (`aria-label`) y son navegables por teclado.
- Alternativa de **modo alto contraste** y **modo sin animaciones**.
- Texto escalable (respetar zoom del navegador hasta 200% sin romper el layout).
- No depender solo del color: iconos + forma + texto para estados correcto/incorrecto.

---

## 13. Stack técnico y estructura

**Recomendado:**
- **Vite + TypeScript + Three.js** (render 3D isométrico low-poly).
- UI en **HTML/CSS** superpuesto al canvas (más accesible y fácil de estilizar) o **React** si se prefiere componer el HUD.
- Estado del juego simple y tipado (`zustand` o un store propio; evitar sobreingeniería).
- **Sin backend.** Progreso en `localStorage` (niveles completados, estrellas, sonido on/off).
- Modelos 3D **procedurales generados por código** (cajas, cilindros, extrusiones) para no depender de assets externos; si se usan GLTF, que sean ligeros y con licencia libre.
- Responsive: escritorio primero, jugable en tablet y móvil en horizontal.

**Estructura sugerida:**

```
/
├─ index.html
├─ src/
│  ├─ main.ts
│  ├─ game/
│  │  ├─ Game.ts            # loop, cámara, input
│  │  ├─ IsometricCamera.ts
│  │  ├─ Level.ts           # carga de escena + estado
│  │  ├─ Interactable.ts    # objeto inspeccionable
│  │  └─ Scoring.ts         # puntos, rachas, estrellas
│  ├─ levels/
│  │  ├─ home.ts
│  │  ├─ cafe.ts
│  │  ├─ workshop.ts
│  │  └─ restaurant.ts
│  ├─ art/
│  │  ├─ palette.ts
│  │  ├─ props.ts           # generadores low-poly
│  │  └─ particles.ts
│  ├─ ui/
│  │  ├─ Hud.ts
│  │  ├─ LevelIntro.ts
│  │  └─ Summary.ts
│  └─ data/
│     └─ tips.ts            # frases-hábito
└─ README.md
```

### Modelo de datos de una ineficiencia

```ts
type Finding = {
  id: string;
  objectId: string;        // objeto 3D asociado
  isWaste: boolean;        // true = ineficiencia, false = señuelo bien usado
  title: string;           // "Luz encendida sin nadie"
  tip: string;             // frase-hábito ≤ 90 caracteres
  hint: string;            // pista amable si falla
  fix?: () => void;        // animación de corrección
};
```

---

## 14. Criterios de aceptación (definición de "terminado")

1. **4 niveles jugables** de principio a fin, cada uno con su escena isométrica propia y distinta.
2. Estética **low-poly isométrica coherente** en todos los niveles (misma paleta, misma luz, mismo nivel de detalle).
3. Bucle completo: explorar → inspeccionar → decidir → corregir → puntuar → resumen.
4. Puntuación legible, con **estrellas** y guardado en `localStorage`.
5. **Cero** unidades técnicas (kWh, W, potencia) en cualquier texto visible.
6. Todos los textos en **español neutro**, cortos y amables.
7. Funciona en Chrome/Edge/Firefox/Safari actuales, escritorio y tablet, a **60 fps** estables.
8. Navegable por teclado y con etiquetas accesibles.
9. `npm install && npm run dev` levanta el juego sin configuración adicional.
10. `README.md` con cómo jugar, cómo agregar un nivel nuevo y notas de diseño.

---

## 15. Restricciones y anti-patrones

- ❌ No convertir el juego en una clase magistral ni en un cuestionario.
- ❌ No usar cifras de consumo, dinero o emisiones.
- ❌ No castigar con "Game Over"; los errores solo restan puntos y dan pistas.
- ❌ No usar estética realista, texturas fotográficas ni iluminación dramática.
- ❌ No añadir menús profundos ni sistemas de inventario: el foco es **mirar y encontrar**.
- ❌ No inventar ineficiencias que no se vean claramente en pantalla.

---

## 16. Primer entregable esperado

Empieza por el **nivel 1: Vivienda**, completamente jugable y pulido, con:
- Escena isométrica low-poly (sala + cocina) con ~7 objetos interactuables (5 ineficiencias + 2 señuelos).
- HUD completo, pantalla de entrada y pantalla de resumen.
- Sistema de puntos, medidor de ahorro y estrellas.
- Un objeto guía/personaje que da la bienvenida con una frase.

Cuando ese nivel esté sólido, replica la estructura para **Cafetería**, **Taller** y **Restaurante**.

---

## 17. Frases de ejemplo (tono de referencia)

**Bienvenida:** "¡Hola, detective! Aquí algo está gastando energía de más. ¿Lo encuentras?"

**Acierto:** "¡Bien visto! Ese aparato gastaba sin que nadie lo usara."

**Error:** "Casi. Ese está funcionando bien… mira de nuevo por aquí."

**Cierre de nivel:** "¡Misión cumplida! Encontraste 5 fugas de energía. Este lugar ya respira mejor."

---

*Fin del prompt. Construye el juego completo, con código funcional y una estética low-poly isométrica que dé gusto mirar.*
