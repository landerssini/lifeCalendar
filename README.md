# Life Calendar

Aplicación web en Next.js (App Router) + TypeScript para visualizar la vida del usuario como un poster de 100 años donde cada punto representa una semana.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth con Magic Link
- Canvas API para dibujar los puntos sobre una imagen estática

## Puesta en marcha

1. Instala dependencias:

```bash
npm install
```

2. Copia las variables de entorno:

```bash
cp .env.example .env.local
```

3. Configura en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. En tu proyecto de Supabase activa `Email` dentro de `Authentication > Providers` y habilita `Magic Link`.

5. Añade `http://localhost:3000` en:

- `Authentication > URL Configuration > Site URL`
- `Authentication > URL Configuration > Redirect URLs`

6. Arranca el entorno local:

```bash
npm run dev
```

## Estructura

- `app/page.tsx`: flujo principal de auth, loading, persistencia y render
- `components/Login.tsx`: pantalla de acceso con magic link
- `components/BirthDateForm.tsx`: formulario para guardar la fecha de nacimiento
- `components/LifeCalendar.tsx`: imagen + canvas escalable + hover opcional
- `lib/date.ts`: cálculo de semanas vividas y fechas por semana
- `lib/supabase.ts`: cliente de Supabase en navegador

## Personalización del overlay

La superposición del canvas usa coordenadas base y escalado proporcional:

- `startX`
- `startY`
- `gapX`
- `gapY`

Si tu diseño final en `public/calendar.png` tiene otra retícula, ajusta esos valores en `components/LifeCalendar.tsx`.

El poster actual se carga desde `public/calendar.png`. Si cambias el nombre o la extensión, actualiza también el `src` de la imagen en `components/LifeCalendar.tsx`.
# lifeCalendar
# lifeCalendar
