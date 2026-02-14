---
description: Cara menjalankan backend API Sewlovely Homeset
---

# Run Backend - Sewlovely Homeset

Workflow ini menjelaskan cara menjalankan backend API untuk aplikasi Sewlovely Homeset.

## Prerequisites

- Node.js >= 18.x terinstall
- npm terinstall

## Langkah-langkah

### 1. Masuk ke folder backend

```bash
cd c:\SEWLOVELY APPS\sewlovely-backend
```

### 2. Install dependencies (pertama kali atau setelah update)

```bash
npm install
```

### 3. Setup database (pertama kali)

```bash
npx prisma generate
npx prisma db push
```

### 4. Jalankan backend server

// turbo
```bash
npm run dev
```

Backend akan berjalan di **http://localhost:3001**

---

## Quick Start (Setelah Setup)

Jika sudah pernah setup sebelumnya, cukup jalankan:

// turbo
```bash
cd c:\SEWLOVELY APPS\sewlovely-backend && npm run dev
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /api/partners | Daftar mitra baru |
| GET | /api/partners | List semua mitra (admin) |

---

## Troubleshooting

### Port sudah digunakan

Jika port 3001 sudah digunakan, ubah di file `src/index.ts`:

```typescript
const PORT = process.env.PORT || 3002; // Ganti port
```

### Database error

Reset database:

```bash
npx prisma db push --force-reset
```
