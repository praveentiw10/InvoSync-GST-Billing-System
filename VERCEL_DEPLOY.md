# Vercel Deployment

## 1. Import project
- In Vercel, import this repository.
- Set the project **Root Directory** to `mamoIn` (if your repo root is one level above it).

## 2. Build settings
- Framework preset: `Vite`
- Build command: `npm run build:web`
- Output directory: `dist`

(`vercel.json` already includes these settings.)

## 3. Environment variables
Add these in Vercel Project Settings -> Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID` (optional)
- `DESKTOP_DOWNLOAD_URL` (optional)
- `VITE_DESKTOP_DOWNLOAD_URL` (optional)

## 4. Supabase
- Run `supabase/schema.sql` in your Supabase SQL editor.
- In Supabase Auth settings, configure the Site URL and redirect URL to your Vercel domain.

## 5. API endpoints on Vercel
- `GET /api/health`
- `POST /api/send-invoice`
- `POST /api/save-invoice-to-drive`
- `GET /api/desktop-download-link`
- `GET /api/desktop-installer`

These are deployed as serverless functions from the `api/` folder.
