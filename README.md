# Mundial Battle

Aplicacion web para competir entre amigos durante el Mundial 2026 con tres modos principales: pronosticos, fantasy y mapa interactivo de sedes.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Componentes UI propios inspirados en shadcn/ui
- Framer Motion
- React Hook Form + Zod
- Prisma ORM + PostgreSQL
- NextAuth con credenciales reales
- TheSportsDB como fuente externa sincronizada desde backend
- React Leaflet
- Recharts

## Rutas

- `/` landing de Mundial Battle
- `/auth` registro/login/perfil demo
- `/dashboard` centro de control del usuario
- `/leagues` crear/unirse a ligas privadas
- `/predictions` pronosticos por partido
- `/fantasy` cancha fantasy, presupuesto y selector de jugadores
- `/map` mapa interactivo de sedes
- `/groups` tablas calculadas por motor interno
- `/bracket` placeholders configurables de fase eliminatoria
- `/ranking` ranking de liga, semanal y global
- `/admin` panel admin simple

## Instalacion

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta la cadena de PostgreSQL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mundial_battle?schema=public"
NEXTAUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_SYNC_TOKEN="generate-a-long-random-admin-token"
THESPORTSDB_API_KEY="tu-api-key"
THESPORTSDB_BASE_URL="https://www.thesportsdb.com/api/v1/json"
THE_SPORTS_DB_WORLD_CUP_LEAGUE_ID="4429"
THE_SPORTS_DB_SEASON="2026"
```

## Base de datos

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

La app usa PostgreSQL como fuente interna y TheSportsDB como proveedor externo. Ejecuta seed/sync para poblar partidos, selecciones y jugadores reales.

Tambien queda configurado `prisma db seed` mediante `package.json`:

```bash
npx prisma db seed
```

## Sincronizacion TheSportsDB

La app nunca llama TheSportsDB desde React. El flujo es:

```text
TheSportsDB -> /api/admin/sync/world-cup -> PostgreSQL -> motor interno -> frontend
```

Endpoint protegido:

```bash
curl -X POST http://localhost:3000/api/admin/sync/world-cup \
  -H "Authorization: Bearer replace-this-admin-token"
```

Tambien puedes ir a `/admin`, pegar `ADMIN_SYNC_TOKEN` y presionar `Sincronizar Mundial desde TheSportsDB`.

Si la API falla, responde vacia o alcanza limites, se registra un `SyncLog` y se conservan los ultimos datos guardados en PostgreSQL.

Con cuenta premium, el servicio construye la URL como:

```text
THESPORTSDB_BASE_URL/THESPORTSDB_API_KEY
```

Ejemplo: `https://www.thesportsdb.com/api/v1/json/TU_KEY`. Tambien mantiene compatibilidad con `THE_SPORTS_DB_BASE_URL` si ya lo tenias.

## Acciones Persistentes

La UI ahora llama endpoints internos con Prisma para reemplazar las acciones demo:

- `POST /api/leagues`: crea una liga y genera codigo.
- `POST /api/leagues/join`: une al usuario demo por codigo.
- `POST /api/predictions`: crea/actualiza pronostico antes del inicio.
- `POST /api/fantasy/team`: guarda el once fantasy validando 11 jugadores, formacion y maximo por seleccion.

Las acciones usan la sesion real de NextAuth; si el usuario no inicia sesion, los endpoints responden `401`.

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Verificacion

```bash
npm run lint
npm run build
npm run test
```

## Despliegue en Railway

La opcion recomendada es Railway con Nixpacks y salida standalone de Next.js. El proyecto ya incluye `railway.json` para ejecutar migraciones antes de arrancar.

1. Crea un proyecto en Railway y agrega PostgreSQL.
2. Conecta el repositorio.
3. Configura estas variables:

```bash
DATABASE_URL="la-url-que-entrega-railway-postgres"
NEXTAUTH_SECRET="un-secreto-largo-y-aleatorio"
NEXTAUTH_URL="https://tu-dominio.up.railway.app"
ADMIN_SYNC_TOKEN="un-token-admin-largo-y-aleatorio"
THESPORTSDB_API_KEY="tu-api-key"
THESPORTSDB_BASE_URL="https://www.thesportsdb.com/api/v1/json"
THE_SPORTS_DB_WORLD_CUP_LEAGUE_ID="4429"
THE_SPORTS_DB_SEASON="2026"
```

Railway ejecuta:

```bash
npm run build
npm run prisma:migrate:deploy
npm run start
```

Si cambias el dominio en Railway, actualiza `NEXTAUTH_URL` con la URL final para que NextAuth firme y cierre sesiones correctamente.

## Prueba visual por modulo

Con `npm run dev`, revisa:

- `/`: hero, fondos animados, cards de modulos y botones.
- `/dashboard`: proximo partido, estadisticas, top de liga, grafico y cancha fantasy.
- `/predictions`: cards deportivas, countdown, bloqueo y guardado.
- `/fantasy`: cancha, presupuesto, validaciones, filtros por posicion/pais/precio.
- `/map`: pins, modal de estadio, imagen fallback y partidos por sede.
- `/groups`: tablas calculadas internamente y clasificados resaltados.
- `/bracket`: placeholders configurables de eliminatoria.
- `/ranking`: podio, medallas, ranking y desglose.
- `/admin`: gate con token, sync TheSportsDB, ultimo sync y formularios admin.

## Arquitectura

- `app/`: rutas principales.
- `components/`: UI compartida, layout y componentes por modulo.
- `lib/dbData.ts`: adaptadores de PostgreSQL hacia los componentes del frontend.
- `lib/integrations/theSportsDb.ts`: cliente backend y normalizador de TheSportsDB.
- `lib/sync/worldCupSync.ts`: servicio de sincronizacion a PostgreSQL.
- `lib/tournament/tournamentEngine.ts`: tablas, clasificados, mejores terceros y bracket.
- `lib/fantasyRules.ts`: reglas de presupuesto, tamano de plantilla y maximo por seleccion.
- `lib/scoring.ts`: reglas de puntos de pronosticos y fantasy.
- `lib/validations/`: esquemas Zod.
- `prisma/schema.prisma`: modelo relacional listo para PostgreSQL.
- `prisma/seed.ts`: carga inicial para equipos, estadios, partidos, jugadores y liga demo.

## Datos 2026

El seed limpia datos de prueba y ejecuta sincronizacion real contra TheSportsDB. Con la key premium probada aqui se obtuvieron 72 partidos, 48 selecciones y 1248 jugadores. La tabla de la API devuelve 48 filas, pero actualmente sin `strGroup`; por eso la UI no inventa grupos y muestra estado pendiente hasta que TheSportsDB entregue ese campo.
