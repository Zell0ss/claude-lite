# Claude Lite — Implementation Guide (para Claude Code)

> Manual de implementación del diseño. Complementario a `design-system.md` (el porqué) y `mockup.html` (la verdad visual). Este documento es el **cómo**.

**Público objetivo**: dev implementando los componentes. Lee con tono imperativo: "haz esto, así".

**Alcance**: capa presentacional + puntos de costura mínimos con la lógica. No entra en rutas API, persistencia ni streaming del lado servidor — eso es territorio de `2026-04-16-claude-lite-design.md`.

**Cuando surjan dudas**:
- Sobre **decisiones de diseño** ("¿por qué esto así?") → `design-system.md`.
- Sobre **aspecto visual final** ("¿cómo tiene que verse?") → `mockup.html`, abrirlo en el navegador.
- Sobre **cómo implementar** → este documento.

---

## 0. Principios que no se tocan

Sea cual sea la versión de librerías que acabes usando, estas reglas son invariantes:

1. **Tema oscuro único**. Sin toggle. Todos los colores vía CSS variables. Nunca hardcodear `#ffffff` o `bg-white`.
2. **Jerarquía por superficie, no por adornos**. Elemento activo = fondo cambia. Sin bordes decorativos, sin sombras fuertes, sin indicadores laterales.
3. **No hay líneas divisorias**. Las secciones se separan por espaciado, no por `<hr>` ni `border-b`.
4. **El assistant no tiene burbuja**, el user sí. Esto es deliberado — no lo "corrijas".
5. **El color coral (`--accent`) aparece en muy pocos sitios**: botón de enviar idle-con-texto, asterisco coral, focus rings, dot de modelo Opus. No lo uses en headers, borders decorativos, hover states genéricos.
6. **Accesibilidad desde el principio**: `aria-label` en botones icon-only, focus visible con `--accent`, trap de foco en modales, `aria-live="polite"` en el último turn del assistant durante streaming.

---

## 1. Setup

### 1.1 Dependencias esperadas

Asume que trabajas con:

- **Next.js 15 App Router**, output `standalone`.
- **Tailwind CSS** (v3 o v4 — la sintaxis de tokens cambia, abajo doy las dos variantes).
- **shadcn/ui** con estilo CLI estándar.
- **lucide-react** para iconos.
- **react-markdown** + **remark-gfm** + **shiki** para render de Markdown.
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) para streaming.

Si alguna de estas versiones difiere de lo que esperabas, usa la tuya — el diseño no depende de versiones concretas.

### 1.2 Fuentes

Carga las tres vía `next/font/google`. Expón cada una como CSS variable en `<html>`:

- `Plus Jakarta Sans` → `--font-sans`, pesos 400, 500, 600, 700.
- `Instrument Serif` → `--font-serif`, peso 400 (único disponible). Italic opcional.
- `JetBrains Mono` → `--font-mono`, pesos 400, 500.

### 1.3 Componentes shadcn a instalar

Mínimo necesario para el MVP:

```
button, dialog, dropdown-menu, popover, input, textarea, tooltip
```

Opcional (puedes usar `sonner` en su lugar, como prefieras):

```
toast   (o sonner)
scroll-area  (solo si el scroll nativo estilizado no te convence)
```

Para el textarea con auto-grow: `react-textarea-autosize` (librería externa, no shadcn).

### 1.4 Estructura de directorios sugerida

No es obligatoria, solo orientativa:

```
app/
├── (auth)/login/page.tsx
├── chat/[id]/page.tsx
├── page.tsx                       # blank chat
└── layout.tsx

components/
├── ui/                            # shadcn instalados aquí
├── chat/
│   ├── chat-input.tsx             # input reutilizable (blank + conv)
│   ├── message.tsx
│   ├── user-message.tsx
│   ├── assistant-message.tsx
│   ├── pulsing-asterisk.tsx
│   ├── scroll-to-bottom.tsx
│   └── markdown-renderer.tsx
├── sidebar/
│   ├── sidebar.tsx
│   ├── conversation-list-item.tsx
│   └── conversation-menu.tsx
├── dialogs/
│   ├── rename-dialog.tsx
│   └── delete-dialog.tsx
└── common/
    └── error-toast.tsx

lib/
└── shiki.ts                        # helper de highlighting

styles/
└── globals.css
```

---

## 2. `globals.css` listo para copiar

Elige la variante según versión de Tailwind.

### 2.1 Variante Tailwind v3

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Neutros */
    --background: 0 0% 10%;
    --sidebar: 0 0% 7%;
    --popover: 0 0% 15%;
    --card: 0 0% 12%;
    --muted: 0 0% 18%;
    --muted-hover: 0 0% 14%;
    --border: 0 0% 20%;

    /* Texto */
    --foreground: 0 0% 92%;
    --foreground-muted: 0 0% 64%;
    --foreground-subtle: 0 0% 45%;

    /* Acento coral */
    --accent: 14 56% 52%;
    --accent-hover: 14 56% 58%;
    --accent-foreground: 0 0% 100%;

    /* Inline code */
    --code-inline-bg: 5 30% 22%;
    --code-inline-fg: 5 70% 75%;

    /* Semánticos */
    --destructive: 0 70% 62%;

    /* Radios */
    --radius: 0.375rem;
  }

  html {
    color-scheme: dark;
  }

  body {
    @apply bg-[hsl(var(--background))] text-[hsl(var(--foreground))];
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar fino custom */
  .scroll-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .scroll-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scroll-thin::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 3px;
  }
  .scroll-thin::-webkit-scrollbar-thumb:hover {
    background: hsl(0 0% 28%);
  }

  /* Animación pulso del asterisco */
  @keyframes pulse-asterisk {
    0%, 100% { opacity: 0.4; transform: scale(0.9); }
    50%      { opacity: 1;   transform: scale(1); }
  }
}
```

### 2.2 Variante Tailwind v4

Tailwind v4 usa `@theme` directamente en CSS. Los mismos tokens van dentro de un bloque `@theme` en vez de `:root`. Consulta la docs de tu versión — los **valores** son idénticos, solo cambia la sintaxis de declaración.

---

## 3. `tailwind.config.ts`

Mapea las CSS variables como colores de Tailwind. En v4 esto va en el CSS directamente; en v3 va aquí:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class", // no la usaremos, pero mejor declararlo
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        sidebar: "hsl(var(--sidebar))",
        popover: "hsl(var(--popover))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        "muted-hover": "hsl(var(--muted-hover))",
        border: "hsl(var(--border))",
        foreground: "hsl(var(--foreground))",
        "foreground-muted": "hsl(var(--foreground-muted))",
        "foreground-subtle": "hsl(var(--foreground-subtle))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          hover: "hsl(var(--accent-hover))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: "hsl(var(--destructive))",
        "code-inline-bg": "hsl(var(--code-inline-bg))",
        "code-inline-fg": "hsl(var(--code-inline-fg))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        md: "6px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
      },
      animation: {
        "pulse-asterisk": "pulse-asterisk 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-asterisk": {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.9)" },
          "50%":      { opacity: "1",   transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 4. Componente crítico: `<PulsingAsterisk />`

Este es el único componente que entrego **con código concreto** porque el SVG y el comportamiento de 3 estados son muy específicos. El resto los defines tú con la spec.

```tsx
// components/chat/pulsing-asterisk.tsx
import { cn } from "@/lib/utils"; // el helper de shadcn

type AsteriskState = "pulsing" | "resting" | "static";

interface PulsingAsteriskProps {
  state?: AsteriskState;
  size?: number; // px, default 14
  className?: string;
}

export function PulsingAsterisk({
  state = "pulsing",
  size = 14,
  className,
}: PulsingAsteriskProps) {
  const animationClass =
    state === "pulsing" ? "animate-pulse-asterisk" : "";
  // resting y static renderizan sin animación — resting implica que
  // venía de pulsing y se ha quedado fijo; static es el del greeting/login.

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn(
        "inline-block text-accent shrink-0",
        animationClass,
        className
      )}
      style={{
        width: size,
        height: size,
        transformOrigin: "center",
      }}
    >
      <g fill="currentColor">
        <rect x="45" y="5" width="10" height="90" rx="2" />
        <rect x="45" y="5" width="10" height="90" rx="2" transform="rotate(45 50 50)" />
        <rect x="45" y="5" width="10" height="90" rx="2" transform="rotate(90 50 50)" />
        <rect x="45" y="5" width="10" height="90" rx="2" transform="rotate(135 50 50)" />
      </g>
    </svg>
  );
}
```

**Estados y cuándo usar cada uno**:

| Estado | Cuándo | Dónde |
|---|---|---|
| `pulsing` | Mientras se genera la respuesta (pre-primer-token + streaming) | Al final del contenido del último assistant message |
| `resting` | Tras terminar el stream del último assistant message | A la izquierda del mensaje (abajo), como firma |
| `static` | Icono de marca decorativo | Greeting del blank chat, login, wordmark |

**Nota sobre "resting"**: cuando llega un nuevo turn del assistant, el anterior pierde su asterisco. **Solo el último mensaje del assistant de la conversación** tiene asterisco en reposo.

---

## 5. Markdown + Shiki

### 5.1 Setup de Shiki

Tema base: `github-dark-dimmed`. Necesitarás override de algunos colores para alinear con la paleta coral.

```ts
// lib/shiki.ts
import { createHighlighter } from "shiki";

// Carga lazy — instancia única, inicializada la primera vez que se usa.
let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-dimmed"],
      langs: [
        "typescript", "javascript", "tsx", "jsx",
        "python", "rust", "go", "bash", "shell",
        "json", "yaml", "toml", "dockerfile",
        "sql", "html", "css", "markdown",
      ],
    });
  }
  return highlighterPromise;
}
```

### 5.2 Override de colores (opcional, para mayor fidelidad a claude.ai)

El palette observado en claude.ai es más cálido que `github-dark-dimmed`. Si quieres afinar:

- **Keywords** (`if`, `FROM`, `async`, `const`) → coral `hsl(14 70% 65%)`.
- **Strings** → verde suave `hsl(142 40% 62%)`.
- **Keys JSON / propiedades** → rosa claro `hsl(5 70% 75%)`.
- **Variables / funciones** → rosa más saturado `hsl(5 70% 75%)`.
- **Comments** → `hsl(var(--foreground-subtle))`, itálica.
- **Numbers** → azul suave `hsl(210 50% 70%)`.

Se implementa pasándole un tema custom a Shiki o transformando el output. Esto es **nice-to-have**, no bloqueante — empieza con `github-dark-dimmed` puro.

### 5.3 Render de Markdown

Configura `react-markdown` con `remark-gfm` (para tablas y más). Spec de componentes:

- `p`: `text-base leading-relaxed mb-4` (último sin margin).
- `strong`: `font-semibold` (sin cambio de color).
- `em`: `italic`.
- `h1, h2, h3`: `font-semibold mt-6 mb-2`, tamaños `text-xl / text-lg / text-base`.
- `ul, ol`: `pl-6 mb-4 space-y-2`. Markers en `foreground-muted`.
- `blockquote`: `border-l-2 border-border pl-4 mb-4 text-foreground-muted`.
- `a`: `underline underline-offset-2`, hover color `accent`.
- `table`: bordes `border border-border`, `th` con `bg-muted font-semibold`.
- `code` (inline): `font-mono text-[0.9em] bg-code-inline-bg text-code-inline-fg px-1.5 py-0.5 rounded`.
- `pre > code` (block): contenedor con `bg-card rounded-lg p-4 my-4 overflow-x-auto`, etiqueta de lenguaje arriba-izquierda (`text-xs text-foreground-subtle`).

**Importante**: el `code` inline nunca va dentro de un `<pre>`. Distingue ambos casos: si es inline, tratamiento rosa/coral; si es block, es un code block.

---

## 6. Componentes a crear

Cada componente con su spec esencial y props esperadas. El detalle visual queda en `design-system.md` y `mockup.html`.

### 6.1 `<Sidebar />`

**Ancho**: 260px fijo.
**Fondo**: `bg-sidebar`.
**Layout**: header (wordmark) / "Nueva conversación" button / lista scrolleable de conversaciones. **Sin footer**.

**Props esperadas**:
```ts
interface SidebarProps {
  conversations: Array<{
    id: string;
    title: string;
    model: "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";
    updatedAt: number;
  }>;
  activeConversationId: string | null;
  onNewChat: () => void;
  onRename: (id: string, newTitle: string) => void;
  onChangeModel: (id: string, newModel: string) => void;
  onDelete: (id: string) => void;
}
```

### 6.2 `<ConversationListItem />`

**Alto**: 36px. **Padding**: `px-3`. **Radio**: `rounded-md`.

**Anatomía**: `[título truncado] [dot modelo] [botón ⋯ solo en hover/active]`.

**Estados**: normal (transparente) / hover (`bg-muted-hover`) / active (`bg-muted` + `font-semibold` en título).

**Dot de modelo**: `size-2 rounded-full`, colores:
- Opus → `bg-accent`.
- Sonnet → `bg-foreground-muted`.
- Haiku → `bg-foreground-subtle`.

**Nota**: Haiku con `foreground-subtle` puede quedar casi invisible. Si lo ves demasiado apagado en el render real, subir a `hsl(0 0% 55%)` o similar.

**Tooltip** al hover sobre el dot con el nombre completo del modelo (delay 500ms).

### 6.3 `<ConversationMenu />`

**Trigger**: botón icon-only 28×28px con `MoreHorizontal`. Visible en hover del item o siempre que el item esté activo.

**DropdownMenu** (shadcn) con radio `rounded-xl`, fondo `bg-popover`.

**Orden exacto**:
```
Renombrar                [Pencil]
Cambiar modelo      ►    [Sparkles]  ← submenú
────── (espacio, sin <Separator>)
Eliminar                 [Trash2]   ← variant destructive
```

**Submenú "Cambiar modelo"**:
- Items: `Opus 4.7`, `Sonnet 4.6`, `Haiku 4.5`.
- Modelo actual marcado con `Check` en color `accent` a la derecha.
- Click cambia modelo y cierra menú.

**Item destructive**:
- Texto e icono en `text-destructive`.
- Hover: `hover:bg-destructive/10` (fondo con alpha bajo).
- Abre `<DeleteDialog>` — **no borra directo**.

### 6.4 `<ChatInput />`

Componente **único reutilizable** en dos contextos.

**Props**:
```ts
interface ChatInputProps {
  variant: "blank" | "conversation";
  model: string;                          // id de modelo actual
  onModelChange: (model: string) => void;
  onSubmit: (text: string, systemPrompt?: string) => void;
  isStreaming: boolean;
  onStop: () => void;                     // abort del stream
  // Solo si variant === "blank":
  systemPrompt?: string;
  onSystemPromptChange?: (value: string) => void;
}
```

**Anatomía**:
- Contenedor `bg-muted rounded-2xl` con padding `pt-4 px-4 pb-2`.
- Textarea auto-grow (usa `react-textarea-autosize`), placeholder `"Responder…"`.
- Fila inferior: chip "System prompt" (solo en variant `blank`) a la izquierda / selector de modelo + botón enviar a la derecha.

**Botón enviar** — 3 estados:
| Estado | Fondo | Icono | Habilitado |
|---|---|---|---|
| `isStreaming === false && text === ""` | `bg-muted` (se funde) | `ArrowUp` en `foreground-subtle` | No |
| `isStreaming === false && text !== ""` | `bg-accent` | `ArrowUp` en `accent-foreground` | Sí (envía) |
| `isStreaming === true` | `bg-muted` elevado | `Square` (filled) en `foreground` | Sí (llama `onStop`) |

**Chip System prompt (variant blank)**:
- Icono `SlidersHorizontal` + label "System prompt".
- Click: expande un `<textarea>` adicional **dentro del mismo contenedor**, arriba del textarea principal, separado por `border-t border-border/50`.
- Placeholder del system prompt: `"Instrucciones del sistema (opcional)…"`.

**Envío**: Enter envía, Shift+Enter añade salto de línea.

**Bloqueo durante streaming**: el textarea sigue editable pero el Enter no envía — solo `onStop` responde al botón.

### 6.5 `<UserMessage />`

```ts
interface UserMessageProps {
  content: string;
}
```

- Burbuja `bg-muted rounded-2xl px-4 py-3`.
- `max-w-[540px]` (o el equivalente a ~70% del max-width del área).
- `text-base leading-relaxed`.
- Alineada a la derecha (usar `flex justify-end` en el wrapper).
- Inline code dentro sí aplica el tratamiento rosa/coral.
- **Sin Markdown completo** — solo texto plano con detección de inline code si quieres. El user turn es input plano en el MVP.

### 6.6 `<AssistantMessage />`

```ts
interface AssistantMessageProps {
  content: string;
  isStreaming: boolean;
  isLast: boolean;  // para decidir si muestra el asterisco en reposo
}
```

- **Sin burbuja**. Texto directo sobre `bg-background`.
- Ancho completo de la columna central.
- Usa `<MarkdownRenderer>` con el `content`.
- **Asterisco**:
  - Si `isStreaming === true` → `<PulsingAsterisk state="pulsing" />` **al final** del contenido (inline).
  - Si `isStreaming === false && isLast === true` → `<PulsingAsterisk state="resting" />` a la **izquierda del mensaje**, abajo. Posicionamiento: `position: absolute; left: -24px; bottom: 8px;` (relativo al contenedor del mensaje).
  - Si `isStreaming === false && isLast === false` → **sin asterisco**.

**Para `aria-live`**: envuelve el contenido en streaming con `<div aria-live="polite">` solo mientras `isStreaming === true`.

### 6.7 `<Header />`

- Altura 56px.
- Padding `px-6`.
- Contenido: **solo el título** de la conversación, alineado a la izquierda, `text-xl font-semibold`, ellipsis.
- **Nada a la derecha**. No chevron, no botón, no nada.

```ts
interface HeaderProps {
  title: string;
}
```

### 6.8 `<ScrollToBottom />`

- Círculo 36×36px, `bg-muted rounded-full shadow-sm`.
- Icono `ArrowDown size-4` en `foreground-muted`.
- Posición: `absolute`, centrado horizontalmente sobre el input con ~16px de offset vertical desde el input.
- Aparece con fade (180ms) cuando el scroll del contenedor de mensajes no está al fondo (threshold ~100px).
- Click: scroll suave al fondo.

### 6.9 `<RenameDialog />` y `<DeleteDialog />`

Modales shadcn. Fondo `bg-popover rounded-xl`, overlay `bg-black/50 backdrop-blur-sm`.

**RenameDialog**: input con título actual precargado, acciones `[Cancelar] [Guardar]`.

**DeleteDialog**: descripción "Esta acción no se puede deshacer…", acción principal en variante destructive (`bg-destructive text-white`).

### 6.10 `<BlankChat />`

Pantalla inicial sin conversación activa.

- Área principal con greeting centrado verticalmente al ~40% del viewport (no 50% exacto).
- Greeting: **`<PulsingAsterisk state="static" size={40} />`** + `"¿En qué puedo ayudarte?"` en `font-serif text-[40px]`.
- Debajo: `<ChatInput variant="blank" />`.

### 6.11 `<Login />`

Página `/login`.

- Card centrado, max-width 400px.
- Wordmark: `<PulsingAsterisk state="static" size={28} />` + `"Claude Lite"` en `font-serif text-[32px]`.
- Input password + botón primary con `bg-accent`.
- Estado error: `border-destructive` en el input + mensaje en `text-destructive text-sm` debajo.

### 6.12 `<ErrorToast />`

Puedes usar `sonner` (más simple) o el `toast` de shadcn. Spec:

- Bottom-right, 16px de margin.
- `bg-popover rounded-lg p-4 border-l-2 border-destructive`.
- Icono `TriangleAlert` en `text-destructive` a la izquierda.
- Título `text-sm font-medium` + descripción `text-sm text-foreground-muted`.
- Auto-dismiss 5s.

**Mensajes de ejemplo**:
- "Error en el stream. El mensaje no se ha guardado."
- "No se ha podido conectar con la API."
- "Sesión expirada. Inicia sesión de nuevo."

---

## 7. Mapeo de iconos (Lucide)

| Uso | Icono |
|---|---|
| Nueva conversación | `CirclePlus` |
| Menú tres puntos | `MoreHorizontal` |
| Renombrar | `Pencil` |
| Cambiar modelo | `Sparkles` |
| Eliminar | `Trash2` |
| Chevron submenú (derecha) | `ChevronRight` |
| Chevron dropdown (abajo) | `ChevronDown` |
| Modelo seleccionado | `Check` |
| Enviar | `ArrowUp` |
| Parar streaming | `Square` (filled) |
| Scroll to bottom | `ArrowDown` |
| System prompt chip | `SlidersHorizontal` |
| Cerrar modal | `X` |
| Error toast | `TriangleAlert` |

**Stroke width**: `1.5` (default).
**Tamaños**: `size-4` (16px) para la mayoría; `size-5` (20px) en controles del input.

---

## 8. Puntos de costura con la lógica (ligero)

No te voy a decir cómo montar el streaming ni las rutas — ese es tu terreno. Solo dejo claro **qué espera recibir cada componente** y **qué señal dispara qué**, para que no haya ambigüedad sobre dónde casar el AI SDK con el diseño.

### 8.1 Estado de streaming

En el hook que gestione la conversación (sea `useChat` del AI SDK o uno propio), necesitas exponer al menos:

```ts
{
  messages: Message[];      // historial
  isStreaming: boolean;     // true desde que se envía hasta que termina o aborta
  stop: () => void;         // abort del stream actual
  sendMessage: (text: string, systemPrompt?: string) => void;
}
```

`<ChatInput>` consume `isStreaming` y `stop`. `<AssistantMessage>` consume `isStreaming` **solo para el último mensaje** (mapea `isLast = i === messages.length - 1`).

### 8.2 Stream fallido

Si el stream aborta por error (no por `onStop` del usuario), **el mensaje del assistant no se guarda** y se dispara un toast de error. No hay "mensaje parcial": descartar lo que haya llegado.

Esto es consistente con el spec del producto (`2026-04-16-claude-lite-design.md §5 — Stream fallido`).

### 8.3 Creación de conversación

La conversación se crea al enviar el primer mensaje. El cliente genera un UUID v4, lo usa como `conversation_id` y lo pasa en el body del request. Si la conversación no existía, el servidor la crea con ese UUID.

Desde el punto de vista del diseño: tras enviar el primer mensaje, **navegar a `/chat/<uuid>`** y refrescar la sidebar para que aparezca la nueva conversación.

### 8.4 System prompt

Solo se usa en la creación de la conversación. Tras el primer mensaje, el chip desaparece del `<ChatInput>` (no existe en variant `conversation`). El system prompt queda guardado en la fila `conversations` y no es editable.

### 8.5 Cambio de modelo

Dos vías para el mismo cambio:
- Desde el menú de tres puntos (sidebar) → `PATCH /api/conversations/:id { model }`.
- Desde el selector del input de la conversación → mismo endpoint.

Ambas actualizan la misma fuente de verdad. El componente `<ChatInput>` lee el modelo actual de props, no tiene estado local.

---

## 9. Qué NO hacer

Errores que he visto en implementaciones parecidas y que prevengo explícitamente:

1. **No uses `bg-white` ni `text-black` en ningún sitio**. Todo vía tokens CSS.
2. **No añadas `border-b` en el header del chat**. El diseño no lo lleva.
3. **No pongas el assistant message en una burbuja**. Tentación fácil por consistencia con el user — es deliberadamente asimétrico.
4. **No uses `<Separator />` en el dropdown de tres puntos** entre "Cambiar modelo" y "Eliminar". Es espacio vertical, no línea.
5. **No reproduzcas el pulso del asterisco con `animate-pulse` de Tailwind** — ese es el pulse estándar de opacidad. El nuestro combina opacity y scale. Usa el keyframe custom.
6. **No hagas que el asterisco en reposo aparezca en todos los mensajes del assistant**. Solo en el último. Cuando llega un nuevo turn del assistant, el anterior pierde el asterisco.
7. **No añadas botón "Copy" en los code blocks** en MVP. Decisión cerrada.
8. **No uses `Inter` como fallback de Plus Jakarta Sans**. El `next/font/google` fallback correcto ya trae fallbacks del sistema.
9. **No pongas footer en la sidebar**. Sin avatar, sin nombre, sin nada.
10. **No uses `transition-all`**. Es un anti-pattern. Específica `transition-colors`, `transition-opacity`, etc.
11. **No uses `container queries` para el layout del chat**. Los max-widths son fijos y centrados.
12. **No metas el selector de modelo del `<ChatInput>` fuera del contenedor del input**. Vive dentro, en la fila de acciones.

---

## 10. Checklist de entrega (para autoverificar antes de dar por cerrado)

### Visual
- [ ] La app se ve como el `mockup.html` (abrir ambos en paralelo).
- [ ] Tema oscuro en todas las pantallas, sin flash de light mode en el primer render.
- [ ] Las tres fuentes (Plus Jakarta, Instrument Serif, JetBrains Mono) cargan sin FOUT notable.
- [ ] El asterisco coral pulsa durante streaming y se queda en reposo al terminar, solo en el último mensaje del assistant.
- [ ] El dot de modelo es visible en los 3 colores. Haiku no queda invisible.

### Interacción
- [ ] Enter envía el mensaje, Shift+Enter salto de línea.
- [ ] Durante streaming: Enter no envía, el botón muestra `Square`, click en el botón aborta.
- [ ] Hover sobre item del sidebar muestra fondo sutil + botón de tres puntos.
- [ ] Item activo tiene fondo más marcado y título en semibold.
- [ ] Dropdown de tres puntos abre con Renombrar / Cambiar modelo (submenú) / Eliminar.
- [ ] Eliminar abre modal de confirmación, no borra directo.
- [ ] Modales se cierran con Esc y click fuera.
- [ ] Scroll-to-bottom aparece solo cuando hay scroll, se oculta con fade cuando llegas al final.

### Accesibilidad
- [ ] Todos los botones icon-only tienen `aria-label`.
- [ ] Focus visible en todos los elementos interactivos.
- [ ] Trap de foco en modales.
- [ ] `aria-live="polite"` en el último assistant durante streaming.
- [ ] Contrast ratio AA en todo el texto (spot-check con axe).

### Markdown
- [ ] Párrafos, bold, italic, inline code (rosa/coral), code blocks con syntax highlighting, listas (ul/ol), blockquote, tabla, links renderizan correctamente.
- [ ] Code blocks tienen etiqueta de lenguaje arriba y scroll horizontal si el contenido desborda.
- [ ] Inline code se distingue claramente del body text.

### Navegación
- [ ] `/login` accesible sin cookie, redirige a `/` si hay cookie válida.
- [ ] Rutas `/api/*` protegidas salvo `/api/auth/login`.
- [ ] Al enviar primer mensaje desde blank chat → navega a `/chat/<uuid>`.
- [ ] Cambiar de conversación en la sidebar no pierde historial.

---

## 11. Si te bloquea algo

- **Duda visual**: abre `mockup.html` en el navegador, es la fuente de verdad.
- **Duda de decisión**: `design-system.md §8` tiene las decisiones cerradas.
- **Duda estructural** (rutas, DB, streaming): `2026-04-16-claude-lite-design.md`.
- **No cuadra algo entre los tres documentos**: el orden de precedencia es `2026-04-16-claude-lite-design.md` > `design-system.md` > `mockup.html`. Si el mockup enseña algo distinto del spec, manda el spec y se corrige el mockup a posteriori.

**Fin del documento.**