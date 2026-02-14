# Runbook: Local Development Setup

> **Goal:** Get a developer from zero to running `inkmax` locally.

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Git

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd inkmax
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
     ```bash
     cp .env.example .env
     ```
   - Fill in the required values in `.env`:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key

## Running the App

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   - The app should be running at `http://localhost:8080` (or similar).

## Common Tasks

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Running Tests
```bash
npm run test
```

## Troubleshooting

- **Dependency Issues**: Try deleting `node_modules` and `package-lock.json` and reinstalling.
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Supabase Issues**: Ensure your `.env` variables are correct and match your Supabase project configuration.
