# knowGap

AI-powered learning gap analysis — Express API + static frontend, MongoDB via Mongoose.

## Local setup

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies: `npm install`
3. Seed the database (first run): `npm run seed`
4. Start the server: `npm start`
5. Open `http://localhost:3000` (or the port in `.env`).

## Deploy (Render, Railway, Fly.io, etc.)

1. **Repository**
   - Do not commit `.env` or `node_modules`.
   - If `.env` was ever committed, rotate `JWT_SECRET` and MongoDB credentials.

2. **Service settings**
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Node version:** 20+

3. **Environment variables**

   | Variable       | Required | Notes                                      |
   |----------------|----------|--------------------------------------------|
   | `MONGO_URI`    | Yes      | MongoDB Atlas connection string            |
   | `JWT_SECRET`   | Yes      | Long random string (not the example value) |
   | `NODE_ENV`     | Yes      | Set to `production`                        |
   | `PORT`         | Often    | Usually provided by the host               |
   | `ALLOWED_ORIGINS` | No   | Comma-separated URLs if API is called cross-origin |

4. **MongoDB Atlas**
   - Allow access from your host’s IP or use `0.0.0.0/0` for managed platforms.
   - Run `npm run seed` once against production if the database is empty.

5. **Health check**
   - `GET /api/health` → `{ "ok": true }`

The frontend calls `/api` on the same host — no hardcoded localhost URL.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm start`    | Run production server    |
| `npm run seed` | Seed subjects & questions |
