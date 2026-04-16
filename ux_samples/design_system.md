# Claude Lite — Design System (Fase 1)

> Documento de auditoría, tokens y specs de componentes para el MVP. Inspirado en claude.ai con divergencias conscientes justificadas. Tema oscuro único.

**Fecha**: 2026-04-16
**Entrega**: Fase 1 — tokens + specs (sin código). La Fase 2 (componentes React + Tailwind) se arrancará tras el OK de este documento.

---

## 1. Auditoría de claude.ai

### 1.1 Lo que observamos

A partir de capturas recibidas (sidebar, menú tres puntos, conversación con code blocks, input del chat, blank chat) y research sobre Anthropic, se observa un sistema con estas características:

**Principios rectores detectados (no publicados, inferidos)**

1. **Jerarquía por superficie, no por adornos.** Los elementos activos se señalan con un cambio de color de fondo. **No hay bordes, indicadores laterales, subrayados ni sombras decorativas** en items de navegación. Un elemento activo se ve activo porque su fondo cambia, nada más.

2. **Tres capas de elevación consistentes**:
   - **Capa 0** (más oscura): sidebar.
   - **Capa 1** (intermedia): área principal de chat, burbujas de user, contenedor del input.
   - **Capa 2** (más clara): popovers, dropdowns, menús, modales. Elevación sutil por color, no por sombras fuertes.

3. **Sin líneas divisorias**. Las secciones se separan por espaciado vertical y cambio de peso tipográfico, no por `<hr>` ni borders. Esto aplica tanto a la sidebar como al dropdown de tres puntos.

4. **El contenido del assistant es un documento, no un chatbot**. El texto del assistant vive directamente sobre el fondo del chat, sin burbuja ni contenedor. El user sí tiene burbuja. Este contraste **es deliberado**: refuerza que el user es input efímero y el assistant es contenido persistente.

5. **Color de marca muy contenido**. El coral/naranja de Anthropic solo aparece en tres sitios: botón de enviar, inline code, y el asterisco de marca (símbolo y saludo). Nunca en bordes, en headers, ni en links genéricos.

6. **Tipografía como único sistema de jerarquía en contenido**. Headings no cambian de color ni tienen adornos — solo peso.

### 1.2 Sistema subyacente (lectura técnica)

Claude.ai no publica un design system público. Por la estructura observada:

- **Muy probablemente Radix primitives + Tailwind** (coincide el radio de popovers, el comportamiento hover/active, el patrón destructive text-only del dropdown).
- **Paleta custom con OKLCH o HSL tuneado** (los grises tienen una temperatura cálida coherente, no son grises puros).
- **Iconografía: Lucide React** con altísima probabilidad (los iconos `Pin`, `Pencil`, `FolderPlus`, `Trash2`, `ArrowUp`, `ArrowDown`, `Plus`, `Search`, `CirclePlus` del menú coinciden 1:1 con el set).

### 1.3 Tipografía detectada

- **Wordmark "Claude" y greeting**: serif clásica, muy probablemente **Copernicus** (Commercial Type) o **Tiempos Headline**. Es la tipografía de marca de Anthropic, solo se usa en momentos de marca (logo, saludo).
- **UI y contenido**: sans-serif humanista, con altísima probabilidad **Styrene B** (Berkeley Graphics). Es la tipografía de marca de Anthropic para UI. **De pago**, no disponible en CDNs gratuitos.

Ambas son propietarias y no licenciables sin coste. Decisión tomada: **no licenciamos** (ver §3).

---

## 2. Divergencias conscientes frente a claude.ai

Listado explícito de "aquí me separo de claude.ai y por qué":

| # | Decisión | Claude.ai | Claude Lite | Motivo |
|---|---|---|---|---|
| D1 | **Modelo en sidebar** | No lo muestra por conversación | Sí (divergencia necesaria) | El MVP requiere guardar y mostrar el modelo por conversación. Tratamiento: dot de color o texto tiny junto al título. **Decisión a cerrar**: necesito confirmación sobre el tratamiento exacto (ver §8). |
| D2 | **System prompt en blank chat** | No existe (vive en Projects) | Chip a la izquierda del input que expande un textarea sobre el input | No tenemos Projects. El system prompt es una sola vez (al crear la conversación) y debe integrarse limpio en el blank chat. |
| D3 | **Header del chat** | Breadcrumb proyecto / título + chevron + acciones a la derecha (New chat, Share) | Solo título del chat, sin chevron, sin acciones | Sin proyectos, sin compartir, sin config. Minimalismo radical. |
| D4 | **Orden del menú contextual** | Renombrar / Añadir a proyecto / Eliminar / Mover | Renombrar / Cambiar modelo / (espacio) / Eliminar | La destructiva al final, separada por espacio. Patrón estándar que claude.ai rompe sin buena razón. |
| D5 | **"Cambiar modelo"** | No existe como acción de conversación (se cambia en el input) | Submenú dentro del menú de tres puntos + también accesible desde el input de la conversación | Redundancia buena: el menú es para gestión offline, el input es para cambio en el flujo. |
| D6 | **Asterisco al final del turno del assistant** | Desaparece tras terminar | Se queda en reposo (sin pulso) a la izquierda del último mensaje del assistant | Guiño tomado del CLI de Claude. Da firma visual y "presencia esperando". |
| D7 | **Footer de la sidebar** | Avatar + nombre + icono | Eliminado | Sin config, sin identidad multi-usuario. No hay nada que meter ahí. |
| D8 | **Botones shortcut bajo el blank chat** | Escribir / Aprender / Código / Gmail / Calendar | Eliminados | Fuera del MVP (sin tools, sin integraciones). |
| D9 | **Tabs superiores de la sidebar (Chat / Flow / Code)** | Sí existen | Eliminados | Sin Projects/Artifacts/Code view. |
| D10 | **Tipografía** | Styrene B (UI) + Copernicus (marca) — propietarias | Plus Jakarta Sans (UI) + Instrument Serif (marca) — libres | No licenciamos tipografía propietaria. Elegidas por cercanía estética y disponibilidad en `next/font/google`. |

---

## 3. Tokens

### 3.1 Paleta de color

Todas las variables se declaran en `:root` como CSS variables y se consumen desde Tailwind. Formato HSL (compatible con el patrón shadcn/ui `hsl(var(--name))`).

> **Nota**: los valores a continuación son una propuesta base calibrada a partir de las capturas. Durante Fase 2 (maquetado real sobre Next.js) puede haber afinados de ±3-5% en luminosidad si alguno canta en pantalla. Las relaciones entre capas se respetan.

#### Neutros (tema oscuro)

| Token | HSL | Uso |
|---|---|---|
| `--background` | `0 0% 10%` (≈ `#1a1a1a`) | Fondo del área de chat (capa 1) |
| `--sidebar` | `0 0% 7%` (≈ `#121212`) | Fondo de la sidebar (capa 0, más oscura) |
| `--popover` | `0 0% 15%` (≈ `#262626`) | Popovers, dropdowns, menús contextuales (capa 2) |
| `--card` | `0 0% 12%` (≈ `#1f1f1f`) | Contenedores elevados dentro del chat (code blocks) |
| `--muted` | `0 0% 18%` (≈ `#2e2e2e`) | Fondo de burbuja user, input, item activo sidebar |
| `--muted-hover` | `0 0% 14%` (≈ `#242424`) | Hover sobre items de sidebar |
| `--border` | `0 0% 20%` (≈ `#333333`) | Bordes sutiles (apenas usados, solo cuando imprescindible) |

#### Texto

| Token | HSL | Uso |
|---|---|---|
| `--foreground` | `0 0% 92%` (≈ `#eaeaea`) | Texto principal (body, mensajes) |
| `--foreground-muted` | `0 0% 64%` (≈ `#a3a3a3`) | Texto secundario, labels, placeholders |
| `--foreground-subtle` | `0 0% 45%` (≈ `#737373`) | Texto terciario (headings de sección sidebar "Recents", metadata) |

#### Acento (coral Anthropic)

| Token | HSL | Uso |
|---|---|---|
| `--accent` | `14 56% 52%` (≈ `#c96442`) | Color de marca: botón enviar, asterisco, focus rings |
| `--accent-hover` | `14 56% 58%` (≈ `#d57855`) | Hover del botón de enviar |
| `--accent-foreground` | `0 0% 100%` | Texto sobre `--accent` |

Valor tomado visualmente de las capturas. A calibrar con un cuentagotas sobre la captura del botón de enviar en Fase 2.

#### Inline code (tratamiento "a" — réplica fiel)

| Token | HSL | Uso |
|---|---|---|
| `--code-inline-bg` | `5 30% 22%` (≈ `#4a2d2d`) | Fondo del `<code>` inline, rojo/marrón muy oscuro |
| `--code-inline-fg` | `5 70% 75%` (≈ `#e8a8a0`) | Texto del `<code>` inline, rosa coral claro |

#### Semánticos

| Token | HSL | Uso |
|---|---|---|
| `--destructive` | `0 70% 62%` (≈ `#e05d5d`) | Acciones destructivas (texto "Eliminar" en dropdown, confirm modal) |
| `--destructive-hover-bg` | `0 70% 62% / 0.12` | Fondo al hover sobre item destructive |
| `--success` | `142 45% 55%` (≈ `#5fb87d`) | Reservado, sin uso en MVP |
| `--warning` | `38 90% 60%` (≈ `#f0b040`) | Reservado, sin uso en MVP |

### 3.2 Tipografía

**Familias**

| Variable | Familia | Fallback | Uso |
|---|---|---|---|
| `--font-sans` | Plus Jakarta Sans | ui-sans-serif, system-ui, sans-serif | UI + contenido de chat |
| `--font-serif` | Instrument Serif | Georgia, "Times New Roman", serif | Wordmark + greeting (display, solo tamaño grande) |
| `--font-mono` | JetBrains Mono | ui-monospace, Menlo, Monaco, "Courier New", monospace | Inline code + code blocks |

**Carga**: `next/font/google` para las tres. Zero runtime tree-shaken.

**Pesos disponibles**

- **Plus Jakarta Sans**: 400, 500, 600, 700 (hay más, cargamos solo estos). `display: swap`.
- **Instrument Serif**: 400 (único peso). Solo para tamaños grandes (>32px), ya que es un display condensado.
- **JetBrains Mono**: 400, 500.

**Escala tipográfica**

| Token | Size / Line-height | Uso |
|---|---|---|
| `--text-xs` | 12px / 16px | Labels de secciones sidebar, metadata, etiqueta de lenguaje en code block |
| `--text-sm` | 14px / 20px | UI: items sidebar, botones, dropdown items, placeholders |
| `--text-base` | 16px / 26px | **Contenido del chat** (user + assistant), input textarea |
| `--text-lg` | 18px / 28px | Reservado (actualmente sin uso claro) |
| `--text-xl` | 20px / 28px | Título del chat en header |
| `--text-display` | 40px / 48px | Greeting del blank chat (serif) |

**Line-height del contenido**: relativamente holgado (`1.6` en body) para favorecer lectura larga en respuestas del assistant.

**Letter-spacing**: por defecto (no tracking custom en body). El wordmark y el greeting pueden usar `-0.02em` para cerrar un poco el espaciado a tamaño grande.

**Pesos semánticos**

- `font-normal` (400): body, user messages, placeholders.
- `font-medium` (500): labels de UI enfáticos, algunos botones.
- `font-semibold` (600): headings dentro del contenido Markdown, título del chat, item activo sidebar.
- `font-bold` (700): reservado para contraste puntual.

### 3.3 Spacing

Escala base Tailwind (4px step). No custom. Relevantes:

| Token | Valor | Uso típico |
|---|---|---|
| `space-1` | 4px | Separación mínima icono-badge |
| `space-2` | 8px | Padding interno compacto (dropdown item vertical) |
| `space-3` | 12px | Espaciado icono-label, padding horizontal de items |
| `space-4` | 16px | Padding de paneles, separación vertical entre items |
| `space-6` | 24px | Separación entre grupos de acciones, entre turnos del chat |
| `space-8` | 32px | Márgenes de sección |

**Sidebar**:
- Padding horizontal interno: `px-3` (12px).
- Separación entre items de nav: `gap-1` (4px).
- Separación entre bloque de nav superior y lista de conversaciones: `mt-6` (24px).
- Altura de item conversación: `h-9` (36px).

**Chat area**:
- Max-width de contenido (mensajes): `max-w-3xl` (≈ 768px), centrado horizontalmente en el área.
- Padding horizontal: `px-6` (24px) mínimo.
- Separación vertical entre turnos: `gap-6` (24px).

**Input**:
- Padding interno: `p-4` (16px) arriba, `px-3 pb-2` abajo (fila de acciones).
- Radio interno: ver §3.4.

### 3.4 Radios

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 4px | Elementos compactos (chip/badge, no usado aún) |
| `rounded-md` | 6px | Items del sidebar, dropdown items, botón tres puntos |
| `rounded-lg` | 10px | Code blocks, code inline (ligeramente menor si queda cantoso) |
| `rounded-xl` | 14px | Popovers, dropdowns, modales |
| `rounded-2xl` | 18px | **Input del chat** y **burbujas de user** (misma superficie, mismo radio) |
| `rounded-full` | 9999px | Botón enviar (círculo), scroll-to-bottom, avatar (no aplica MVP) |

El radio del input y la burbuja de user coincidiendo es intencional: refuerza que "lo que el user escribe" y "lo que el user dijo" son la misma superficie material.

### 3.5 Sombras y elevación

Claude.ai usa sombras **muy sutiles**, casi imperceptibles. Predomina el color de fondo diferencial como mecanismo de elevación.

| Token | Valor | Uso |
|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.3)` | Scroll-to-bottom button |
| `shadow-md` | `0 4px 12px -2px rgba(0,0,0,0.4)` | Popovers, dropdowns |
| `shadow-lg` | `0 10px 30px -5px rgba(0,0,0,0.5)` | Modales |

### 3.6 Motion

Duraciones cortas y easings suaves. No hay animaciones decorativas.

| Token | Duración | Easing | Uso |
|---|---|---|---|
| `duration-fast` | 120ms | `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) | Hover de items, cambios de color |
| `duration-base` | 180ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Apertura de popovers, fades |
| `duration-slow` | 240ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Modales, transiciones de layout |

**Animación especial: pulso del asterisco**

- Keyframes: opacidad `0.4 → 1 → 0.4`, scale `0.9 → 1 → 0.9`.
- Duración: `1200ms`.
- Easing: `cubic-bezier(0.4, 0, 0.6, 1)` (ease-in-out).
- Loop: infinito mientras streaming.
- **Estado "en reposo"**: detener el loop dejando opacidad/scale en `1` (no en seco, termina la iteración actual).

---

## 4. Iconografía

**Librería**: `lucide-react`.

**Tamaños estándar**:
- `size-4` (16px): iconos inline en items de sidebar, dropdown items, botones compactos.
- `size-5` (20px): iconos en header y controles del input.
- `size-6` (24px): reservado (ninguno en MVP).

**Stroke width**: `1.5` (default de lucide, coherente con el feel de claude.ai).

**Mapeo de iconos MVP**:

| Uso | Icono Lucide |
|---|---|
| Nueva conversación | `Plus` dentro de un wrapper circular (o `CirclePlus` directamente) |
| Menú tres puntos | `MoreHorizontal` |
| Renombrar | `Pencil` |
| Cambiar modelo | `Sparkles` |
| Eliminar | `Trash2` |
| Chevron submenú | `ChevronRight` |
| Chevron dropdown (modelo en input) | `ChevronDown` |
| Enviar | `ArrowUp` |
| Parar streaming | `Square` (filled) |
| Scroll to bottom | `ArrowDown` |
| Cerrar modal | `X` |
| Collapse sidebar (post-MVP) | `PanelLeft` |

**Asterisco coral**: **no es Lucide**. Es un SVG custom de 8 puntas replicando el símbolo de Anthropic. Spec en §5.7.

---

## 5. Specs por componente

Cada componente con anatomía, estados y comportamiento. Sin código — solo descripción operativa.

### 5.1 Sidebar

**Ancho**: 260px fijo.
**Fondo**: `--sidebar`.
**Layout vertical**: header compacto / nav / lista de conversaciones (scrolleable) / _sin footer_.

**Header de sidebar**
- Contiene: wordmark "Claude Lite".
- Padding: `p-4`.
- Tipografía: `--font-serif`, `text-lg` (18px), `font-normal`, color `--foreground`, `tracking-[-0.01em]`.
- Sin tabs, sin iconos de navegación entre modos.

**Sección de navegación (single item en MVP)**
- Un solo link: **"Nueva conversación"** con icono `CirclePlus` a la izquierda.
- Estados: normal (transparente) / hover (fondo `--muted-hover`) / active (irrelevante, siempre que navegas te lleva a `/`).

**Lista de conversaciones**
- Ordenada por `updated_at DESC`.
- Sin heading de sección (no hay pinned, no hay recents separados en MVP).
- Scroll vertical con scrollbar fino custom.
- Cada item: 36px de alto, padding horizontal 12px, radio `rounded-md`.
- Layout del item: `[título truncado] [dot modelo] [tres puntos al hover]`.
- **Badge de modelo**: dot de 8px (`size-2 rounded-full`) con color según modelo (ver §8-1), entre el título y el trigger de tres puntos. Tooltip al hover con nombre completo del modelo.
- Truncado: `text-overflow: ellipsis`, una sola línea.

**Estados de item conversación**:
| Estado | Fondo | Texto | Tres puntos |
|---|---|---|---|
| Normal | Transparente | `--foreground-muted` | Oculto |
| Hover | `--muted-hover` | `--foreground` | Visible, botón ghost |
| Active | `--muted` | `--foreground`, `font-semibold` | Visible siempre |
| Active + Hover | `--muted` | `--foreground` | Visible |

**Scrollbar**:
- Fino (`width: 6px`), `border-radius: 3px`, `background: transparent` en reposo, `--border` al hacer scroll.
- Implementación: `scrollbar-thin` (plugin tailwind-scrollbar) o CSS custom.

### 5.2 Menú contextual (tres puntos)

**Trigger**: botón icon-only de 28×28px, aparece en hover sobre el item. Al estar abierto, mantiene su propio fondo tipo `--muted`.

**Popover**:
- Fondo `--popover`, radio `rounded-xl`, padding interior `p-1`.
- Sombra `shadow-md`.
- Ancho: auto (mínimo 180px, máximo 240px).
- Posición: alineado a la derecha del trigger, con 4px de offset vertical.
- Animación de apertura: fade + scale desde origen, 180ms.

**Items**:
- Altura 36px, padding horizontal 12px, radio `rounded-md` interno.
- Layout: `[icon size-4] [label]` con `gap-3`.
- Tipografía: `--text-sm`, `font-normal`, color `--foreground`.
- Hover: fondo `--muted`.

**Orden final MVP**:

```
Renombrar              [Pencil]
Cambiar modelo    ►   [Sparkles]
────────────── (espacio, sin línea)
Eliminar               [Trash2]   ← texto y icono en --destructive
```

**Submenú "Cambiar modelo"**:
- Abre a la derecha. Mismo styling que el menú padre.
- Items: `Opus 4.7`, `Sonnet 4.6`, `Haiku 4.5`.
- Modelo actual marcado con checkmark (`Check`) a la derecha.
- Al click: dispara PATCH de la conversación + cierra menú.

**Item destructive ("Eliminar")**:
- Texto e icono en `--destructive`.
- Hover: fondo `--destructive-hover-bg` (tinte rojo muy sutil), texto/icono mantienen color.

### 5.3 Header del chat

**Layout**: full width del área de chat (no del área completa).
**Altura**: 56px.
**Padding horizontal**: `px-6`.
**Fondo**: `--background` (mismo que el área de chat, sin diferencia).
**Borde inferior**: ninguno.

**Contenido**:
- **Izquierda**: título de la conversación.
  - Tipografía: `--text-xl` (20px), `font-semibold`, color `--foreground`.
  - Ellipsis si supera el ancho.
- **Derecha**: nada. Vacío deliberado.

**Sin chevron, sin acciones**. Minimalismo radical. Confirmado en §2-D3.

### 5.4 Área de mensajes

**Layout**: columna centrada de `max-w-3xl` (≈768px) con padding horizontal.
**Scroll**: vertical natural del contenedor.
**Separación entre turnos**: `gap-6` (24px).

#### User turn

- **Alineado a la derecha**.
- Burbuja: fondo `--muted`, radio `rounded-2xl`, padding `px-4 py-3`.
- Ancho máximo: ~70% del max-width, o 540px — lo que sea menor.
- Tipografía: `--text-base`, `font-normal`.
- Contenido: texto plano (sin Markdown en el user turn en MVP).

#### Assistant turn

- **Sin burbuja**. Texto directo sobre `--background`.
- Ancho: toda la columna central.
- Tipografía base: `--text-base`, `font-normal`, `line-height: 1.6`.
- Render de Markdown completo (ver §5.5).
- Asterisco coral al inicio o final según estado (ver §5.7).

### 5.5 Render de Markdown

**Librerías**: `react-markdown` + `remark-gfm` + `shiki` para code.

**Mapeos**:

| Elemento | Tratamiento |
|---|---|
| `p` | `text-base`, `leading-relaxed`, margin-bottom `space-4` (16px) |
| `h1` | `text-xl`, `font-semibold`, `mt-6 mb-3` (no usado en la práctica — bold va embebido) |
| `h2`, `h3` | `text-lg` / `text-base`, `font-semibold`, `mt-6 mb-2` |
| `strong` | `font-semibold`, sin cambio de color |
| `em` | `italic` (ojo: Plus Jakarta Sans tiene italic real, no oblique) |
| `ul`, `ol` | `pl-6`, `space-y-2`, bullets/números en `--foreground-muted` |
| `li` | `text-base`, `leading-relaxed` |
| `blockquote` | `border-l-2`, `border-[--border]`, `pl-4`, `text-[--foreground-muted]` |
| `table` | bordes sutiles `--border`, header con `font-semibold` y fondo `--muted`, filas separadas por borde 1px muy tenue |
| `a` | subrayado sutil (underline), color `--foreground`, hover color `--accent` |
| `code` (inline) | ver §5.5.1 |
| `pre > code` (block) | ver §5.5.2 |
| `hr` | margen vertical generoso, `--border` |

#### 5.5.1 Inline code (tratamiento "a" — réplica fiel)

- Fondo `--code-inline-bg` (rojo/marrón oscuro).
- Texto `--code-inline-fg` (rosa coral claro).
- Tipografía `--font-mono`, `text-[0.9em]` (ligeramente menor que el body).
- Padding `px-1.5 py-0.5`.
- Radio `rounded`.

#### 5.5.2 Code blocks

- Contenedor: fondo `--card`, radio `rounded-lg`, padding `p-4`, overflow-x auto.
- Margin vertical: `my-4`.
- Header del bloque: etiqueta de lenguaje arriba-izquierda.
  - Tipografía `--text-xs`, `font-normal`, color `--foreground-subtle`.
  - Padding superior extra `pt-2` para separar del código.
- Código: `--font-mono`, `text-sm`, `leading-relaxed`.
- Syntax highlighting: **Shiki con tema `github-dark-dimmed`**.
  - **Override de tokens** para alinear con paleta coral: keywords → `--accent` (o un coral más saturado), strings → verde suave (por calibrar), variables → rosa claro.
  - Override queda para Fase 2, requiere testear con JSON, bash, TS, Python.
- Scrollbar horizontal: fino.
- **Sin botón "copy"** en MVP (decisión cerrada en §8-5).

### 5.6 Input del chat

Componente único reutilizado en dos contextos: blank chat (centrado vertical) y conversación activa (fijo abajo).

**Contenedor**:
- Fondo `--muted`, radio `rounded-2xl`, sin borde.
- Padding: `pt-4 px-4 pb-2`.
- Ancho máximo: `max-w-3xl`, centrado.

**Textarea**:
- Transparente, sin borde, sin outline.
- Placeholder: `--foreground-muted`.
- Tipografía `--text-base`, `font-normal`.
- Auto-grow vertical (min 1 línea, max ~8 líneas antes de scroll interno).
- Placeholder: `"Responder…"` (idéntico al de claude.ai, usado en blank chat y en conversación activa).

**Fila de acciones (bottom row)**:
- Layout: `[izquierda: chip system prompt (solo blank chat)] [spacer] [derecha: selector modelo, botón enviar]`
- Altura: 36px.

**Chip "System prompt" (solo blank chat)**:
- Botón ghost con icono `Settings` o `Sliders` + label "System prompt".
- Al click: expande un textarea adicional **dentro del mismo contenedor**, justo arriba del textarea de mensaje, separado por un `border-t` muy sutil.
- El textarea de system prompt tiene placeholder `"Instrucciones del sistema (opcional)…"`.
- Una vez enviado el primer mensaje: el chip desaparece y el system prompt queda fijado en la conversación (no editable).

**Selector de modelo**:
- Botón ghost con label `"Opus 4.7"` + chevron.
- Click: popover con lista de modelos (mismo estilo que submenú de cambiar modelo).
- Texto: `--text-sm`, `font-medium`, color `--foreground-muted` (el modelo es metadata, no protagonista).

**Botón enviar**:
- Círculo 32×32px.
- **Idle disabled** (sin texto): fondo `--muted` (se funde con el contenedor), icono `ArrowUp` en `--foreground-subtle`.
- **Idle enabled** (con texto): fondo `--accent`, icono `ArrowUp` en `--accent-foreground`.
- **Streaming**: fondo `--muted`, icono `Square` (stop) en `--foreground`. Click: aborta el stream.
- Hover (enabled): `--accent-hover`.
- Focus ring: outline `--accent` con offset (accesibilidad).

### 5.7 Asterisco coral

**Glifo**: SVG custom, 8 puntas iguales, trazo sólido. Mantener el tamaño proporcional al texto del mensaje (`1em` aprox).

**Estados**:

| Estado | Posición | Animación |
|---|---|---|
| **Antes del primer token** | A la izquierda de un placeholder vacío en el hueco del próximo mensaje del assistant | Pulso activo |
| **Streaming** | Al final del contenido que va llegando (pegado al último carácter) | Pulso activo |
| **En reposo (último mensaje del assistant)** | A la izquierda del mensaje, al final | Pulso detenido (opacidad 1, scale 1) |

**Persistencia**: solo en el **último mensaje del assistant**. Cuando llega un nuevo turn, el anterior pierde su asterisco.

**Animación del pulso**: ver §3.6.

**Transición pulso → reposo**: termina la iteración actual sin corte, deja el asterisco en opacidad 1 / scale 1.

**Implementación preferida**: inline con el contenido (enfoque A del análisis), sin posicionamiento absoluto, confiando en el flujo natural del texto para que el asterisco acompañe al cursor.

### 5.8 Blank chat

Estado inicial cuando no hay conversación activa.

**Layout**:
- Columna centrada `max-w-3xl`.
- Contenido centrado verticalmente al ~40% de la altura del viewport (no 50% exacto, sigue el patrón de claude.ai).

**Greeting**:
- Línea única: `[✶ asterisco coral]  ¿En qué puedo ayudarte?`
- Tipografía: `--font-serif`, `--text-display` (40px), `font-normal`, color `--foreground`.
- El asterisco a la izquierda es **el mismo SVG** del asterisco coral, en tamaño `1em` del greeting (≈40px).
- Separación asterisco-texto: `gap-4` (16px).
- **No pulsa** (el asterisco del greeting es estático).

**Input**:
- Mismo componente `<ChatInput>` que en conversación, con la variante blank (incluye chip system prompt).

**Márgenes superior e inferior**: suficientes para respirar. Nada más en el viewport.

### 5.9 Login

**Layout**:
- Centrado en viewport.
- Card de ~400px de ancho.

**Anatomía**:
- Título: "Claude Lite" en `--font-serif`, `text-display` tamaño reducido (~32px).
- Asterisco coral a la izquierda (mismo SVG, estático, sin pulso).
- Campo password: input nativo con styling coherente al input del chat (fondo `--muted`, radio `rounded-lg`, padding cómodo).
- Botón submit: botón primary (fondo `--accent`, texto blanco, radio `rounded-lg`, altura 40px, `font-medium`).

**Estados**:
- **Idle**: campo vacío, botón enabled.
- **Loading**: botón con spinner, campo deshabilitado.
- **Error**: campo con borde `--destructive`, mensaje en `--destructive` debajo: "Contraseña incorrecta."

**Sin "recordar dispositivo" ni otros controles**. Un campo, un botón.

### 5.10 Modales

**Base** (aplica a todos):
- Fondo: `--popover`, radio `rounded-xl`, padding `p-6`.
- Ancho máximo: 440px.
- Overlay: `rgba(0,0,0,0.5)` con `backdrop-blur-sm` (sutil).
- Sombra `shadow-lg`.
- Animación: fade + scale-up desde 95%, 180ms.

**Anatomía**:
- Título: `--text-lg`, `font-semibold`.
- Descripción: `--text-sm`, `--foreground-muted`.
- Acciones abajo a la derecha: cancelar (ghost) + acción principal.

**Modal "Eliminar conversación"**:
- Título: "¿Eliminar esta conversación?"
- Descripción: "Esta acción no se puede deshacer. Se eliminarán todos los mensajes."
- Acciones: `[Cancelar]` `[Eliminar]` (variante destructive: fondo `--destructive`, texto blanco).

**Modal "Renombrar"**:
- Título: "Renombrar conversación"
- Input de texto con el título actual precargado.
- Acciones: `[Cancelar]` `[Guardar]` (variante primary).

### 5.11 Toast de error

**Para el stream fallido y errores generales.**

- Posición: bottom-right, 16px margin.
- Fondo `--popover`, radio `rounded-lg`, padding `p-4`.
- Borde izquierdo 2px en `--destructive`.
- Icono `AlertTriangle` a la izquierda en `--destructive`.
- Texto: `--text-sm`, `--foreground`.
- Auto-dismiss a los 5s. Click en ✕ para cerrar antes.

**Copy de ejemplos**:
- "Error en el stream. El mensaje no se ha guardado."
- "No se ha podido conectar con la API."
- "Sesión expirada. Inicia sesión de nuevo."

### 5.12 Scroll-to-bottom button

- Círculo 36px.
- Fondo `--muted`, radio `rounded-full`, sombra `shadow-sm`.
- Icono `ArrowDown` `size-4` en `--foreground-muted`.
- Posición: centrado horizontal sobre el input, offset vertical 16px.
- Visibilidad: aparece con fade 180ms cuando el scroll del chat no está al fondo (threshold: ~100px desde el bottom).
- Click: scroll suave al fondo.

### 5.13 Estado "streaming" — resumen transversal

Qué pasa en la UI durante el streaming de una respuesta:

1. El user envía → se añade el user turn a la lista.
2. Aparece un placeholder para el assistant con el asterisco pulsante coral a la izquierda.
3. Llegan tokens → se renderizan progresivamente. El asterisco sigue al final del texto, pulsando.
4. El botón de enviar cambia a botón `Square` (stop), permanece enabled.
5. El textarea sigue disponible para escribir el siguiente mensaje, pero **enviar está bloqueado** hasta que el stream termine o se aborte (decisión §8-3).
6. Al terminar: el asterisco se queda en reposo a la izquierda del mensaje recién terminado. El botón de enviar vuelve a su estado idle.

---

## 6. Accesibilidad — notas rápidas

- **Contrast ratio**: todos los pares foreground/background cumplen AA para texto normal. Spot-check en Fase 2 con herramienta (axe, WAVE).
- **Focus rings**: visibles en todo elemento interactivo. `outline: 2px solid --accent; outline-offset: 2px;` por defecto.
- **Keyboard**: sidebar navegable con Tab. Menú contextual abrible con Enter, navegable con arrows, cierra con Esc. Modales con trap de foco.
- **Screen readers**: labels en botones icon-only (`aria-label`). Estados de streaming anunciados con `aria-live="polite"` en el último turno del assistant.

Nota: el MVP es single-user y privado, pero la accesibilidad no se paga aparte — se hace bien desde el principio o no se hace.

---

## 7. Mapeo a shadcn/ui

Componentes de shadcn que usaremos como base (todos importables vía `npx shadcn@latest add <name>`):

- `button` — para botones primary y ghost.
- `dialog` — para modales de renombrar y confirmar borrado.
- `dropdown-menu` — para el menú de tres puntos (con submenú).
- `popover` — para el selector de modelo del input.
- `input` — password del login, input de renombrar.
- `textarea` — aunque usaremos `react-textarea-autosize` para el auto-grow.
- `toast` — para errores (o `sonner` si se prefiere, viene bien integrado).
- `scroll-area` — opcional, podemos quedarnos con scroll nativo estilizado.
- `tooltip` — si se añaden tooltips en selectores de modelo.

Componentes **custom** (no shadcn):
- `<ChatInput>` — compuesto alrededor del textarea + fila de acciones.
- `<Message>` — user turn vs assistant turn.
- `<PulsingAsterisk>` — SVG + animación.
- `<ConversationListItem>` — item con hover/active + menú.
- `<Sidebar>` — contenedor completo.

---

## 8. Decisiones cerradas

Todas las decisiones que quedaban abiertas han sido resueltas. Se listan aquí para dejar trazabilidad.

1. **Badge de modelo en sidebar (D1)** → **Dot de color** a la derecha del título.
   - 3 tokens de color: `Opus` = `--accent` (coral), `Sonnet` = `--foreground-muted` (neutral medio), `Haiku` = `--foreground-subtle` (neutral oscuro).
   - Tamaño: `size-2` (8px), `rounded-full`, alineado verticalmente al centro del título.
   - Separación del título: `ml-2`.
   - Siempre visible (no solo en hover), también cuando el item está activo.
   - Tooltip al hover con el nombre completo del modelo (`"Opus 4.7"`, etc.), delay 500ms.

2. **Wordmark "Claude Lite"** en el header de sidebar → **Serif** (`--font-serif`), `text-lg` (18px), `font-normal`, color `--foreground`. Letter-spacing `-0.01em`.

3. **Permitir enviar mensaje durante streaming** → **Bloqueado**. Durante el streaming, el botón de enviar está en modo `Square` (stop). El textarea permanece editable (se puede ir escribiendo el siguiente mensaje), pero no se puede enviar hasta que el stream termine o se aborte.

4. **Copy del placeholder del textarea** → **`"Responder…"`** (réplica de claude.ai) en los dos contextos (blank chat y conversación activa).

5. **Botón "Copy" en code blocks** → **No incluir en MVP**. Decisión de alcance; trivial de añadir en sprint posterior si hace falta.

---

## 9. Huecos y limitaciones de esta fase

Cosas que **no he podido resolver** con certeza a partir de las capturas:

1. **Valores exactos de color**. Los HSL propuestos en §3.1 son una aproximación calibrada visualmente, no medidos con cuentagotas sobre las capturas originales. En Fase 2, primer paso del maquetado: calibración directa. Espero deltas menores (±3-5% luminosidad).

2. **Tema de Shiki exacto**. No he replicado el palette completo de highlighting de claude.ai porque solo tengo dos lenguajes en la muestra (JSON, bash). Para un override preciso necesitaría ver al menos Python, TypeScript y un lenguaje con más keywords (Rust, Go). Estrategia propuesta en Fase 2: empezar con `github-dark-dimmed` + override mínimo sobre keywords y variables.

3. **Comportamiento del submenú de "Cambiar modelo"** en mobile: los submenús Radix en touch funcionan regular. Para MVP desktop no es bloqueante, pero si algún día se quiere mobile habrá que repensarlo como sheet/drawer.

4. **Header del chat — tratamiento del título si es muy largo**. He especificado ellipsis, pero en alguna captura he visto títulos largos que parecen romper con `...`. No he visto overflow con scroll horizontal ni wrap. Confirmo: ellipsis único `text-ellipsis overflow-hidden whitespace-nowrap`.

5. **Comportamiento exacto del asterisco cuando el user envía varios mensajes seguidos**: en el spec dice "solo último mensaje del assistant". Si el user envía dos mensajes sin esperar respuesta (caso edge improbable por D-3), el asterisco sigue al último assistant igual — no al último mensaje cualquiera. Confirmado implícitamente, lo dejo explícito aquí.

---

**Fin del documento de Fase 1.**