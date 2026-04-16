# Claude Lite — Definición de Proyecto

> Cliente web personal para conversar con modelos Claude, con persistencia de conversaciones, desplegado en fly.io. Look & feel inspirado en claude.ai. Uso personal, single-user.

---

## 1. Objetivos

- Tener un cliente Claude propio, controlable, desplegable en fly.io.
- Réplica **ligera** del claude.ai (solo conversación, nada de proyectos/skills/artifacts).
- Conversaciones persistentes y navegables.
- Base extensible para añadir RAG "bajo demanda" entre conversaciones en fase 2.

## 2. Scope

### MVP (Fase 1)
- Selección de modelo entre variantes de Claude actuales.
- Streaming de respuestas (SSE).
- Conversaciones: crear, listar, seleccionar, renombrar, borrar.
- Render de Markdown + syntax highlighting en code blocks.
- Auth simple (password único + cookie de sesión firmada).
- Layout sidebar + chat, inspirado en claude.ai.
- System prompt configurable por conversación (campo opcional).

### Fase 2 (después del MVP, no ahora)
- RAG bajo demanda: indexar conversaciones previas y buscar semánticamente desde la conversación actual. Stack previsto: `sqlite-vec` + embeddings de Voyage AI o OpenAI.
- Export de conversación (Markdown y JSON).
- Búsqueda de texto plano en historial.

### Fase 3 (opcional, si se quiere proteger el volumen)
- Cifrado at-rest en SQLite (SQLCipher o cifrado a nivel campo `content`).

### Explícitamente fuera de scope
- Multi-usuario / multi-tenancy.
- Proyectos, skills, artifacts.
- Uploads de archivos, tools / function calling.
- Cualquier dato corporativo sensible (ver §10).

## 3. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router)** con output `standalone` | Full-stack en un solo proceso, streaming SSE nativo vía AI SDK. |
| LLM SDK | **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) | Streaming y `useChat` listos; soporte Claude de primera. |
| UI | **Tailwind CSS + shadcn/ui** | Replica estética claude.ai con poco esfuerzo. |
| Markdown | `react-markdown` + `remark-gfm` + `shiki` (o `rehype-highlight`) | Render fiel con code highlighting. |
| DB | **SQLite** vía **Drizzle ORM** | Un fichero, migraciones tipadas, suficiente para single-user. |
| Auth | Password único + cookie JWT firmada (`jose`) | Mínimo viable, sin proveedor externo. |
| Runtime | Node 20 LTS en Docker | Compatibilidad fly.io. |

Verificar versiones exactas al arrancar — no asumir estado del repo.

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

## 5. Modelo de datos (SQLite)

```sql
-- conversations
id              TEXT PRIMARY KEY       -- uuid
title           TEXT NOT NULL          -- auto del primer msg, editable
model           TEXT NOT NULL          -- id de modelo actual
system_prompt   TEXT                   -- opcional
created_at      INTEGER NOT NULL       -- unix ms
updated_at      INTEGER NOT NULL

-- messages
id              TEXT PRIMARY KEY
conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
role            TEXT NOT NULL          -- 'user' | 'assistant' | 'system'
content         TEXT NOT NULL          -- markdown/texto plano
model           TEXT                   -- modelo usado para respuesta assistant
created_at      INTEGER NOT NULL

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
CREATE INDEX idx_conv_updated  ON conversations(updated_at DESC);
```

## 6. Modelos disponibles (selector)

Variantes de Claude actuales a ofrecer en el UI (verificar IDs en docs Anthropic al implementar):

- `claude-opus-4-7`    — Opus 4.6 (máxima capacidad)
- `claude-sonnet-4-6`  — Sonnet 4.6 (balance)
- `claude-haiku-4-5-20251001` — Haiku 4.5 (rápido y barato)

Guardar el modelo elegido por conversación; mostrarlo en el header.

## 7. Endpoints (API routes)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Password → cookie de sesión |
| POST | `/api/auth/logout` | Borra cookie |
| GET  | `/api/conversations` | Lista (paginada, orden por updated_at desc) |
| POST | `/api/conversations` | Crea (opcional: modelo, system_prompt) |
| GET  | `/api/conversations/:id` | Detalle + mensajes |
| PATCH | `/api/conversations/:id` | Renombrar, cambiar modelo/system_prompt |
| DELETE | `/api/conversations/:id` | Borra conversación y mensajes |
| POST | `/api/chat` | Envía mensaje, devuelve stream SSE; persiste al terminar |

Middleware: todas las rutas excepto `/api/auth/login` y `/login` requieren cookie válida.

## 8. Variables de entorno / secrets

```
ANTHROPIC_API_KEY   # set vía `fly secrets set`
AUTH_PASSWORD_HASH  # bcrypt del password, via `fly secrets set`
AUTH_COOKIE_SECRET  # 32 bytes random, via `fly secrets set`
DATABASE_URL        # p.ej. file:/data/app.db
NODE_ENV=production
```

## 9. Despliegue fly.io

### Dockerfile (esquema)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build    # next build con output:'standalone'

# Runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Scripts de migración Drizzle y entrypoint que haga migrate antes de arrancar
EXPOSE 3000
CMD ["node", "server.js"]
```

### fly.toml (esquema)
```toml
app = "claude-lite-<tu-sufijo>"
primary_region = "mad"   # Madrid, el más cercano

[build]

[env]
  DATABASE_URL = "file:/data/app.db"

[mounts]
  source      = "claude_lite_data"
  destination = "/data"

[http_service]
  internal_port = 3000
  force_https   = true
  auto_stop_machines  = "stop"   # ahorra dinero cuando no lo uso
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory   = "512mb"   # 256mb justo con Node; 512mb da margen
  cpu_kind = "shared"
  cpus     = 1
```

### Comandos de deployment
```bash
fly launch --no-deploy                 # genera app, saltar deploy inicial
fly volumes create claude_lite_data -r mad -s 1
fly secrets set ANTHROPIC_API_KEY=... AUTH_PASSWORD_HASH='...' AUTH_COOKIE_SECRET=...
fly deploy
```

### Coste estimado
- VM shared 512MB auto-stop: ~$2-4/mes según uso.
- Volumen 1GB: dentro de los 10GB gratis.
- IPv4 dedicada (si aplicable): $2/mes.
- Egreso: despreciable para uso personal.
- **Total realista: $4-8/mes** + consumo de API Anthropic.

## 10. Consideraciones de seguridad / compliance

- **No introducir datos corporativos sensibles** en las conversaciones (PII, código propietario confidencial, datos de clientes). La API de Anthropic sin contrato empresarial no es apta para eso.
- Password fuerte (>16 chars, aleatorio) + cookie `Secure`, `HttpOnly`, `SameSite=Lax`.
- Rate limit básico en `/api/auth/login` para evitar brute force.
- No loggear cuerpos de mensajes en producción.

## 11. Criterios de aceptación del MVP

- [ ] Puedo hacer login con password, cookie válida 30 días.
- [ ] Puedo crear conversación, elegir modelo, enviar mensaje y ver respuesta en streaming token a token.
- [ ] La conversación aparece en la sidebar con su título (auto de las primeras palabras del primer mensaje, editable).
- [ ] Puedo cambiar de conversación sin perder el historial.
- [ ] Puedo borrar una conversación (con confirmación).
- [ ] Código, tablas y listas se renderizan correctamente en las respuestas.
- [ ] Si reinicio el contenedor, las conversaciones siguen ahí.
- [ ] El login protege todas las rutas `/api/*` salvo `/api/auth/login`.

## 12. Plan de implementación sugerido (fases para Claude Code)

1. **Bootstrap**: `create-next-app`, Tailwind, shadcn/ui init, Drizzle + migración inicial, Dockerfile.
2. **Auth**: login page, middleware de cookie, `AUTH_PASSWORD_HASH`.
3. **CRUD de conversaciones**: endpoints + sidebar que las liste.
4. **Chat streaming**: `/api/chat` con AI SDK, `useChat` en cliente, persistencia al finalizar el stream.
5. **Pulido UI**: selector de modelo, edición de título, markdown + syntax highlighting.
6. **Dockerfile + fly.toml**, probar en fly.io.
7. **Hardening**: rate limit login, logging sin cuerpos, healthcheck endpoint.

### Fases posteriores (no MVP)
8. **Fase 2 — RAG**: `sqlite-vec` + embeddings, búsqueda semántica entre conversaciones, export md/json, búsqueda de texto plano.
9. **Fase 3 — Cifrado at-rest**: SQLCipher o cifrado de campo `content`. Opcional, si se quiere proteger el volumen.

## 13. Decisiones cerradas

| Decisión | Valor | Nota |
|---|---|---|
| Región fly.io | `mad` (Madrid) | |
| API key Anthropic | ✅ Disponible (cuenta personal) | |
| Cuenta fly.io | ❌ **Pendiente de crear** + añadir tarjeta | Hacer antes del primer deploy |
| Dominio | `<app>.fly.dev` | Dominio custom descartado: el proxy corporativo podría bloquear nombres nuevos. `.fly.dev` ya está permitido. |
| Tema UI | Oscuro (sin toggle por ahora) | |
| Cifrado payload (proxy MITM) | Descartado conscientemente | Uso personal, preguntas de código no sensibles. Transparencia > ofuscación. |
| Cifrado at-rest (SQLite) | Fase 3 opcional | SQLCipher o cifrado a nivel de campo `content`. Protege si alguien accede al volumen. |

## 14. Prerequisitos antes de arrancar con Claude Code

1. Crear cuenta en [fly.io](https://fly.io) y añadir tarjeta.
2. Instalar `flyctl` CLI: `brew install flyctl` (o equivalente).
3. Tener a mano la `ANTHROPIC_API_KEY`.
4. Generar un password fuerte y su hash bcrypt para `AUTH_PASSWORD_HASH`.
5. Generar 32 bytes aleatorios para `AUTH_COOKIE_SECRET` (`openssl rand -hex 32`).

---

**Próximos pasos**: crear la cuenta de fly.io, y luego pasar este documento completo a Claude Code para arrancar por el paso 1 del plan de implementación (§12).