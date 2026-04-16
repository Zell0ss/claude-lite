# Claude Lite — Design Document

> Cliente web personal para conversar con modelos Claude, con persistencia de conversaciones, desplegado en fly.io. Look & feel inspirado en claude.ai. Uso personal, single-user.

Fecha: 2026-04-16  
Basado en: `PROJECT.md` + sesión de brainstorming con Josem

---

## 1. Objetivos

- Cliente Claude propio, controlable, desplegable en fly.io.
- Réplica **ligera** de claude.ai (solo conversación, sin proyectos/skills/artifacts).
- Conversaciones persistentes y navegables.
- Base extensible para RAG bajo demanda en Fase 2.

---

## 2. Scope

### MVP (Fase 1)
- Selección de modelo entre variantes de Claude actuales.
- Streaming de respuestas (SSE).
- Conversaciones: crear (auto al primer mensaje), listar, renombrar, cambiar modelo, borrar.
- Render de Markdown + syntax highlighting en code blocks.
- Auth simple (password único + cookie de sesión firmada, 30 días).
- Layout sidebar + chat, tema oscuro, inspirado en claude.ai.
- System prompt configurable **al crear** la conversación (no editable después).

### Explícitamente fuera de scope (MVP)
- Multi-usuario / multi-tenancy.
- Proyectos, skills, artifacts.
- Uploads de archivos, tools / function calling.
- Edición del system prompt tras la creación.
- Export, búsqueda de texto, RAG (Fase 2).
- Cifrado at-rest (Fase 3, opcional).

---

## 3. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router)**, output `standalone` | Full-stack en un proceso, SSE nativo vía AI SDK |
| LLM SDK | **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) | `useChat` + streaming listos; soporte Claude de primera |
| UI | **Tailwind CSS + shadcn/ui** | Replica estética claude.ai con poco esfuerzo |
| Markdown | `react-markdown` + `remark-gfm` + `shiki` | Render fiel con code highlighting |
| DB | **SQLite** vía **Drizzle ORM** | Un fichero, migraciones tipadas, suficiente para single-user |
| Auth | Password único + cookie JWT firmada (`jose`) | Mínimo viable, sin proveedor externo |
| Runtime | Node 20 LTS en Docker | Compatibilidad fly.io |

---

## 4. Arquitectura

```
┌─────────────────────────────────────────┐
│  Browser (Next.js client)               │
│  - Sidebar conversaciones               │
│  - Chat con streaming                   │
│  - Selector de modelo                   │
└───────────────┬─────────────────────────┘
                │ fetch + SSE
                ▼
┌─────────────────────────────────────────┐
│  Next.js server (App Router)            │
│  /api/chat        → streamText          │
│  /api/conversations (CRUD)              │
│  /api/auth/login, /api/auth/logout      │
├─────────────────────────────────────────┤
│  Drizzle ORM → SQLite (/data/app.db)    │
└───────────────┬─────────────────────────┘
                │ HTTPS
                ▼
         api.anthropic.com
```

---

## 5. Flujos clave

### Nueva conversación (auto-creación)

1. El usuario llega al blank chat: ve dropdown de modelo, campo colapsable "System prompt (opcional)" y el input de mensaje.
2. Al enviar el primer mensaje:
   - El **cliente genera un UUID v4** y lo usa como `conversation_id`.
   - Llama a `POST /api/chat` con `{conversation_id, model, system_prompt?, messages}`.
3. El servidor comprueba si existe la conversación. Si no → la crea con ese UUID, guarda el mensaje del usuario, hace streaming, al terminar guarda el mensaje del assistant.
4. El **título se genera truncando** el texto del primer mensaje del usuario a ~60 caracteres.
5. El cliente actualiza la URL a `/chat/<uuid>` y refresca la sidebar.

**Decisión de diseño:** el cliente genera el UUID (no el servidor) para evitar round-trips y simplificar la integración con `useChat`. Aceptable para single-user (sin riesgo de colisiones).

### Conversación existente

- El cliente envía `conversation_id` existente → el servidor no crea nada.
- Streaming y persistencia igual que arriba.

### Stream fallido

- Si el stream se interrumpe (error de red, error de API), el assistant message **no se guarda**.
- El usuario ve un toast de error y puede reenviar.
- No se guardan mensajes parciales.

---

## 6. Modelo de datos (SQLite)

```sql
-- conversations
id              TEXT PRIMARY KEY       -- uuid generado por el cliente
title           TEXT NOT NULL          -- truncado del primer mensaje (~60 chars)
model           TEXT NOT NULL          -- id de modelo actual (editable post-creación)
system_prompt   TEXT                   -- opcional, fijado en creación, no editable después
created_at      INTEGER NOT NULL       -- unix ms
updated_at      INTEGER NOT NULL

-- messages
id              TEXT PRIMARY KEY
conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
role            TEXT NOT NULL          -- 'user' | 'assistant'
content         TEXT NOT NULL
model           TEXT                   -- modelo usado para respuesta assistant
created_at      INTEGER NOT NULL

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX idx_conv_updated  ON conversations(updated_at DESC);
```

---

## 7. API Routes

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Password → cookie de sesión (30 días) |
| POST | `/api/auth/logout` | Borra cookie |
| GET  | `/api/conversations` | Lista ordenada por `updated_at desc` |
| GET  | `/api/conversations/:id` | Detalle + mensajes |
| PATCH | `/api/conversations/:id` | Edita `title` y/o `model` (no `system_prompt`) |
| DELETE | `/api/conversations/:id` | Borra conversación y mensajes |
| POST | `/api/chat` | Envía mensaje, devuelve stream SSE; crea conversación si no existe; persiste al finalizar |

**`POST /api/chat` body:**
```json
{
  "conversation_id": "uuid-generado-por-cliente",
  "model": "claude-sonnet-4-6",
  "system_prompt": "opcional, solo se usa si la conversación es nueva",
  "messages": [{ "role": "user", "content": "..." }]
}
```

Middleware: todas las rutas excepto `/api/auth/login` y `/login` requieren cookie válida.

---

## 8. UI / UX

**Sidebar (izquierda, ~260px):**
- Botón "New chat" arriba.
- Lista de conversaciones con título + badge de modelo, ordenada por `updated_at desc`.
- Menú tres puntos al hover: **Renombrar** / **Cambiar modelo** / **Borrar** (con modal de confirmación).
- Conversación activa resaltada.

**Área principal (derecha):**
- Header: título de la conversación + badge del modelo activo.
- Lista de mensajes con scroll; Markdown renderizado con syntax highlighting.
- Input fijo abajo; estado streaming visible (cursor, botón deshabilitado).

**Blank chat (sin conversación activa):**
- Selector de modelo (dropdown), campo "System prompt" colapsable, input de mensaje.
- Al enviar → transición directa a la conversación recién creada.

**Login (`/login`):**
- Página minimalista, campo password, submit.

**Tema:** oscuro únicamente, sin toggle.

> Diseño visual a cargo del diseñador de Josem. Consultar dudas de UX con él.

---

## 9. Modelos disponibles

| ID | Nombre |
|---|---|
| `claude-opus-4-7` | Opus 4.7 (máxima capacidad) |
| `claude-sonnet-4-6` | Sonnet 4.6 (balance) |
| `claude-haiku-4-5-20251001` | Haiku 4.5 (rápido y barato) |

Guardar modelo por conversación; mostrarlo en sidebar y header.

---

## 10. Variables de entorno

```
ANTHROPIC_API_KEY     # fly secrets set
AUTH_PASSWORD_HASH    # bcrypt del password
AUTH_COOKIE_SECRET    # 32 bytes random (openssl rand -hex 32)
DATABASE_URL          # file:/data/app.db
NODE_ENV=production
```

---

## 11. Despliegue fly.io

Región: `mad` (Madrid). VM shared 512MB, auto-stop. Volumen 1GB en `/data`.

**Coste estimado: $4–8/mes** + consumo API Anthropic.

Ver esquemas de Dockerfile y fly.toml en `PROJECT.md §9`.

---

## 12. Seguridad

- Password >16 chars + cookie `Secure`, `HttpOnly`, `SameSite=Lax`.
- Rate limit en `/api/auth/login`.
- No loggear cuerpos de mensajes en producción.
- No introducir datos corporativos sensibles (API Anthropic sin contrato empresarial).

---

## 13. Criterios de aceptación del MVP

- [ ] Login con password, cookie válida 30 días.
- [ ] Crear conversación al enviar el primer mensaje, con modelo y system prompt opcionales.
- [ ] Streaming token a token visible en el chat.
- [ ] Conversación aparece en sidebar con título truncado del primer mensaje.
- [ ] Cambiar de conversación sin perder historial.
- [ ] Renombrar título y cambiar modelo desde menú tres puntos.
- [ ] Borrar conversación con confirmación.
- [ ] Código, tablas y listas renderizados correctamente.
- [ ] Persistencia tras reinicio del contenedor.
- [ ] Todas las rutas `/api/*` protegidas salvo `/api/auth/login`.

---

## 14. Plan de implementación (fases)

1. **Bootstrap**: `create-next-app`, Tailwind, shadcn/ui, Drizzle + migración inicial, Dockerfile base.
2. **Auth**: login page, middleware de cookie, `AUTH_PASSWORD_HASH`.
3. **CRUD de conversaciones**: endpoints + sidebar.
4. **Chat streaming**: `/api/chat` con AI SDK, `useChat` en cliente, auto-creación con UUID del cliente, persistencia al finalizar.
5. **Pulido UI**: selector de modelo, menú tres puntos, Markdown + syntax highlighting.
6. **Dockerfile + fly.toml**, deploy en fly.io.
7. **Hardening**: rate limit login, logging sin cuerpos, healthcheck.

### Fases posteriores
8. **Fase 2 — RAG**: `sqlite-vec` + embeddings, búsqueda semántica, export md/json.
9. **Fase 3 — Cifrado at-rest**: SQLCipher o cifrado a nivel campo `content` (opcional).

---

## 15. Decisiones cerradas

| Decisión | Valor |
|---|---|
| Región fly.io | `mad` |
| Tema UI | Oscuro, sin toggle |
| Generación de título | Truncar primer mensaje del usuario (~60 chars) |
| System prompt | Solo en creación, no editable después |
| Edición post-creación | Renombrar + cambiar modelo (menú tres puntos) |
| Stream fallido | Descartar — no guardar parciales |
| Creación de conversation_id | Cliente genera UUID v4 |
| Single-user | Siempre. Repo público para que cada uno despliegue el suyo |
| Dominio | `<app>.fly.dev` (dominio custom descartado) |
| Cifrado payload | Descartado conscientemente |
| Cifrado at-rest | Fase 3, opcional |
