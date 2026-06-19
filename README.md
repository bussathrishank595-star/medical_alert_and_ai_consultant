# MediAlert AI

MediAlert AI is a production-ready MERN application for medicine inventory management, expiry tracking, admin alerts, OpenAI-powered medicine classification, and an AI health assistant that recommends only medicines available in inventory.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Chart.js, React Hot Toast
- Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, OpenAI, Helmet, CORS, rate limiting
- Deployment: Vercel frontend, Render backend, MongoDB Atlas database

## Project Structure

```text
.
+-- backend
|   +-- .env.example
|   +-- package.json
|   +-- src
|       +-- app.js
|       +-- config
|       +-- controllers
|       +-- jobs
|       +-- middleware
|       +-- models
|       +-- routes
|       +-- services
|       +-- utils
|       +-- validators
+-- frontend
|   +-- .env.example
|   +-- package.json
|   +-- src
|       +-- api
|       +-- components
|       +-- context
|       +-- pages
+-- package.json
```

## Features

- JWT authentication with bcrypt password hashing
- Role-based access for admins and customers
- Admin medicine CRUD with OpenAI categorization
- Automatic AI-generated medicine descriptions and images when the admin leaves them blank
- Medicine categories, symptoms, usage, and warning metadata stored in MongoDB
- Daily expiry cron job with `Expired` and `Expiring Soon` status updates
- Admin dashboard cards and Chart.js analytics
- Customer medicine search and medicine details
- AI health assistant with chat history and inventory-limited recommendations
- User management and AI classification log views
- Helmet, CORS, input validation, rate limiting, and environment-driven config
- Responsive white, blue, and green medical dashboard with dark mode

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`

### Medicines

- `GET /api/medicines`
- `GET /api/medicines/:id`
- `POST /api/medicines` admin
- `PUT /api/medicines/:id` admin
- `DELETE /api/medicines/:id` admin
- `GET /api/medicines/admin/classifications` admin

### Chat

- `POST /api/chat`
- `GET /api/chat/history`

### Dashboard

- `GET /api/dashboard/stats` admin

### Users

- `GET /api/users` admin
- `PATCH /api/users/:id/role` admin

## Local Setup

1. Install dependencies:

```bash
npm --prefix backend install
npm --prefix frontend install
```

2. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

3. Fill `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medialert-ai
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
ADMIN_EMAILS=admin@example.com
NODE_ENV=development
```

`ADMIN_EMAILS` controls who becomes an admin at registration. Use a comma-separated list for multiple admins.

4. Create frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

5. Start both apps in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Backend runs on `http://localhost:5050` in this workspace. Frontend runs on `http://localhost:5173`.

## Demo Accounts

In development, the backend seeds these users automatically if they do not already exist:

- Admin: `admin@example.com` / `Admin@12345`
- Customer: `customer@example.com` / `Customer@12345`

These accounts are created only outside production.

## OpenAI Behavior

When an admin creates or edits a medicine, the backend sends the medicine name and manufacturer to OpenAI and stores:

```json
{
  "category": "Fever",
  "symptoms": ["fever", "headache"],
  "description": "Paracetamol 500mg is a fever and pain relief medicine commonly stocked for headaches.",
  "usage": "Helps reduce fever and mild pain.",
  "warnings": "Use as directed and consult a doctor if symptoms persist.",
  "imagePrompt": "Create a clean, realistic product-style medical image ..."
}
```

If `OPENAI_API_KEY` is missing or the API call fails, the backend uses deterministic local fallback generation for description, usage, warnings, and a pharmacy-style placeholder image so inventory workflows still function.

The AI assistant only receives matched, in-stock, non-expired inventory candidates. It is instructed to avoid diagnosis, recommend only listed medicines, include usage and precautions, and add the required serious-symptom disclaimer.

## Deployment

### MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Add a database user and allow Render's outbound IP access, or temporarily allow `0.0.0.0/0`.
3. Copy the connection string into `MONGODB_URI`.

### Render Backend

1. Create a new Web Service from this repository.
2. Set root directory to `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables from `backend/.env.example`.
6. Set `CLIENT_URL` to your Vercel frontend URL.
7. If you have preview URLs, add them in `CLIENT_URLS` as a comma-separated list.

### Vercel Frontend

1. Import this repository in Vercel.
2. Set root directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_API_URL=https://your-render-service.onrender.com/api`.
6. The included `frontend/vercel.json` keeps client-side routes working on refresh.

## Security Notes

- Use a long random `JWT_SECRET` in production.
- Do not commit real `.env` files.
- Keep `ADMIN_EMAILS` restricted to trusted admin addresses.
- Configure MongoDB Atlas network access carefully for production.
- OpenAI outputs are stored as classification metadata and should be reviewed by admins.
- For local development, the frontend points at `http://127.0.0.1:5050/api` because another service in this environment already occupies port `5000`.

## Medical Disclaimer

MediAlert AI is an inventory and assistance tool. It does not diagnose diseases and does not replace a licensed clinician, pharmacist, or emergency care.
