# Life Calendar

Aplicación web en Next.js (App Router) + TypeScript para visualizar la vida como un póster de 100 años donde cada punto representa una semana.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- localStorage para perfiles locales
- Canvas API para dibujar los puntos sobre una imagen estática

## Puesta en marcha

1. Instala dependencias:

```bash
npm install
```

2. Arranca el entorno local:

```bash
npm run dev
```

No hace falta configurar variables de entorno ni autenticación. Los perfiles se guardan en el navegador del dispositivo.

## Flujo principal

- La home permite crear perfiles con `nombre` + `fecha de nacimiento`
- Puedes guardar varios perfiles en el mismo navegador
- Cada perfil se puede abrir en su propia ruta `/calendar/[profileId]`, editar o eliminar
- El calendario guarda su progreso visual y sus datos auxiliares en `localStorage`
- La ruta `/life` genera el wallpaper listo para usar en iPhone
- La ruta `/life-test` sirve para probar el render de la imagen

## Estructura

- `app/page.tsx`: home con alta, edición y listado de perfiles locales
- `app/calendar/[profileId]/page.tsx`: vista del calendario para un perfil concreto
- `app/life/route.tsx`: imagen dinámica del wallpaper
- `app/life-test/page.tsx`: página de test para la ruta `/life`
- `components/BirthDateForm.tsx`: alta, edición y listado de perfiles guardados
- `components/LifeCalendar.tsx`: póster principal, canvas, estadísticas, selector de modo y tutorial de iPhone
- `lib/profiles.ts`: modelo y persistencia base de perfiles locales
- `lib/date.ts`: cálculo de semanas vividas y fechas por semana
- `lib/wallpaper.tsx`: render del wallpaper

## Personalización del overlay

La superposición del canvas usa coordenadas base y escalado proporcional. Si tu diseño final en `public/calendar.png` tiene otra retícula, ajusta esos valores en `components/LifeCalendar.tsx`.

El poster actual se carga desde `public/calendar.png`. Si cambias el nombre o la extensión, actualiza también el `src` de la imagen en `components/LifeCalendar.tsx`.
