# Desktop Build Guide

## Prerequisites
- Node.js 20+
- npm

## Install dependencies
```bash
npm install
```

## Configure SMTP
1. Copy `.env.example` to `.env`.
2. Fill in SMTP values:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `FROM_EMAIL`

## Run desktop app in development
```bash
npm run dev:desktop
```

## Build Windows installer
```bash
npm run build:desktop
```

Output will be generated in `release/`.
Distribute the generated `*Setup*.exe` installer (preferred) or the generated desktop `.zip`/`.msi` package.
Never distribute `release/win-unpacked/*.exe` directly.

## Offline behavior
- Invoice creation, editing, login, and PDF export work offline.
- Email sending needs internet.
- If internet is unavailable, email jobs are queued and retried automatically.
