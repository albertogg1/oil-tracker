# Oil Tracker — Diseño de la aplicación

**Fecha:** 2026-09-19
**Estado:** Aprobado

---

## 1. Objetivo

Aplicación web para consultar y comparar precios de gasolina en España. El usuario puede buscar gasolineras por ciudad o por radio alrededor de su ubicación actual, filtrar por tipo de combustible, ver resultados en mapa y lista, y consultar la evolución histórica del precio de una gasolinera concreta.

Se publicará en Vercel. La API key de precioil.es nunca se expone en el cliente.

---

## 2. Stack tecnológico

| Capa | Tecnología | Razón |
|---|---|---|
| Framework | Next.js 14 (App Router) | Deploy trivial en Vercel, API Routes como proxy |
| Estilos | Tailwind CSS | Utilidades rápidas, compatible con design tokens Apple |
| Componentes UI | shadcn/ui | Accesibles, sin estilos impuestos |
| Estado / caché | TanStack Query (React Query) | Cacheo de peticiones, estados de carga, refetch automático |
| Mapa | Leaflet + react-leaflet | Gratuito, sin registro |
| Tiles del mapa | OpenStreetMap | Gratuito |
| Gráfico | Recharts | Ligero, declarativo, compatible con React |
| Animaciones | Framer Motion | Transiciones del drawer y tarjetas |
| Deploy | Vercel | Integración nativa con Next.js |

---

## 3. Fuente de datos — precioil.es API

Base URL: `https://api.precioil.es`
Autenticación: API key en header (gestionada solo en servidor).

### Endpoints utilizados

| Endpoint | Uso en la app |
|---|---|
| `GET /estaciones/radio` | Gasolineras por lat/lng + radio (endpoint principal) |
| `GET /fuel-types` | Listado de tipos de combustible |
| `GET /cambios/precios/historico` | Historial de precios de una gasolinera (últimos 30 días) |

> **Nota:** `/estaciones/municipio/{idMunicipio}` requiere un ID numérico que el usuario no conoce.
> En su lugar, cuando el usuario busca por nombre de ciudad, se geocodifica con **Nominatim (OSM)**
> (`https://nominatim.openstreetmap.org/search`) para obtener lat/lng y luego se usa `/estaciones/radio`.
> Esto mantiene un único endpoint de gasolineras y aprovecha el ecosistema OSM ya incluido.

### Parámetros clave
- `/estaciones/radio`: `lat`, `lng`, `radio` (km), `idFuelType`, `response=full`
- `/cambios/precios/historico`: `idEstacion`, `idFuelType`, fecha inicio (hoy - 30 días), fecha fin (hoy)
- Nominatim: `q` (nombre ciudad), `countrycodes=es`, `format=json`, `limit=5`

---

## 4. Arquitectura

### API Routes (proxy servidor)

```
/app/api/
├── stations/route.ts           → proxy a /estaciones/radio o /estaciones/municipio
├── fuel-types/route.ts         → proxy a /fuel-types
└── price-history/[id]/route.ts → proxy a /cambios/precios/historico
```

Cada route lee `process.env.PRECIOIL_API_KEY` y lo añade al header. El cliente nunca ve la key.

### Estructura de carpetas

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← Shell principal (Server Component)
│   └── api/
│       ├── stations/route.ts
│       ├── fuel-types/route.ts
│       └── price-history/[id]/route.ts
├── components/
│   ├── SearchBar.tsx             ← Input ciudad + botón "usar mi ubicación"
│   ├── FiltersPanel.tsx          ← Tipo combustible + slider de radio
│   ├── ViewToggle.tsx            ← Switch mapa / lista
│   ├── MapView.tsx               ← Leaflet con markers coloreados
│   ├── StationList.tsx           ← Lista de tarjetas ordenable
│   ├── StationCard.tsx           ← Tarjeta individual
│   └── StationDrawer.tsx         ← Panel lateral con detalle + gráfico
├── hooks/
│   ├── useStations.ts            ← React Query hook para /api/stations
│   ├── useFuelTypes.ts           ← React Query hook para /api/fuel-types
│   ├── usePriceHistory.ts        ← React Query hook para /api/price-history
│   └── useGeocoder.ts            ← React Query hook para Nominatim (ciudad → lat/lng)
├── lib/
│   └── precioil.ts               ← Funciones servidor para llamar a la API
├── types/
│   └── index.ts                  ← Tipos TypeScript compartidos
└── .env.local                    ← PRECIOIL_API_KEY (no se sube a git)
```

---

## 5. Flujo de usuario principal

1. El usuario abre la app → se solicita geolocalización del navegador
2. Si acepta → se usa lat/lng actual con radio por defecto (5 km)
3. Si rechaza → muestra un `SearchBar` para introducir ciudad → se geocodifica con Nominatim → lat/lng
4. Los resultados se muestran simultáneamente en **MapView** y **StationList**
5. El usuario puede cambiar filtros (combustible, radio) → React Query refetch automático
6. Al pulsar una tarjeta o un marker → se abre `StationDrawer`
7. El drawer muestra: datos de la gasolinera, precio actual destacado, y gráfico de evolución histórica (Recharts `LineChart`)

---

## 6. UI — Estética Apple

### Tokens de diseño

| Token | Valor |
|---|---|
| Fondo principal | `#F5F5F7` |
| Superficie (tarjetas) | `#FFFFFF` |
| Border radius tarjetas | `18px` |
| Tipografía | Inter (fallback SF Pro) |
| Pesos | 400 / 500 / 600 |
| Sombra tarjeta | `0 2px 20px rgba(0,0,0,0.07)` |
| Blur panel flotante | `backdrop-filter: blur(20px)` |

### Colores de precio (semáforo relativo)
Los precios se clasifican en tres bandas calculadas sobre el rango mín-máx de los resultados actuales:

- Verde: precio en el tercio inferior del rango
- Amarillo: precio en el tercio medio
- Rojo: precio en el tercio superior

---

## 7. Gestión de estado y caché

- **TanStack Query** gestiona todas las peticiones al servidor
- La clave de caché incluye todos los filtros activos (`[stations, lat, lng, radius, fuelType]`)
- `staleTime: 5 minutos` — datos frescos sin refetch innecesario
- `gcTime: 10 minutos` — retención en caché tras inactividad
- El drawer de historial tiene su propia clave `[price-history, stationId, fuelType]`

---

## 8. Variables de entorno

```
# .env.local (desarrollo)
PRECIOIL_API_KEY=tu_api_key_aqui

# Vercel → Settings → Environment Variables (producción)
PRECIOIL_API_KEY=tu_api_key_aqui
```

---

## 9. Despliegue en Vercel

- Conectar el repositorio GitHub a Vercel
- Añadir `PRECIOIL_API_KEY` en Vercel → Settings → Environment Variables
- Deploy automático en cada push a `main`
- Las API Routes se convierten automáticamente en Serverless Functions

---

## 10. Lo que NO incluye (descartado por YAGNI)

- Autenticación de usuarios
- Favoritos persistentes (se puede añadir después con localStorage)
- Notificaciones de precio
- Soporte multi-país
- PWA / app nativa
