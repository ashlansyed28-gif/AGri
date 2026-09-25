# AI-Powered Agriculture Crop Advisory Assistant

This is a full-stack web application designed for farmers and agronomists to manage farm plots and receive highly optimized AI-driven crop advisories using Google Gemini.

## Features
- Secure authentication for user profiles
- Dashboard for tracking farm plots (crop type, acreage, region)
- AI Advisory Generation using Gemini to generate detailed fertilizer, irrigation, and risk management plans based on soil pH, N-P-K, moisture, weather, and growth stage.
- Built with React (Vite), Node.js (Express), Replit Postgres (pg), and Tailwind CSS.

## Setup Instructions

### Backend Setup
1. Navigate to `backend` directory.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your variables:
   - `DATABASE_URL` for PostgreSQL
   - `JWT_SECRET`
   - `GEMINI_API_KEY` (Get from Google AI Studio)
4. Create PostgreSQL database and tables using the provided `setup.sql` in the backend directory.
5. Run the server: `npm run dev`

### Frontend Setup
1. Navigate to `frontend` directory.
2. Install dependencies: `npm install`
3. Start Vite dev server: `npm run dev`

## Tech Stack
- Frontend: React, Vite, React Router, React Hook Form, Zod, Tailwind CSS
- Backend: Node.js, Express, pg, bcryptjs, jsonwebtoken, zod, @google/genai, express-rate-limit
- Database: PostgreSQL
