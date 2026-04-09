# Inventory System

Inventory System is a Next.js app for managing products, inventory, sales, members, and user roles.

## Requirements

- Node.js 20 or newer
- npm

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create a local SQLite database and apply the Prisma migrations.

```bash
npx prisma migrate dev
```

3. Load the demo data.

```bash
npx prisma db seed
```

4. Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - start the app in development mode
- `npm run build` - build the app for production
- `npm run start` - run the production build
- `npm run lint` - run ESLint
- `npm run test:unit` - run Vitest unit and API tests
- `npm run test:e2e` - run Playwright end-to-end tests
- `npm run test` - run unit tests then E2E tests
- `npm run test:ci` - run lint, build, unit tests, and E2E tests

## Environment Variables

The app works with SQLite out of the box, but these variables are used when configured:

- `DATABASE_URL` - database connection string, defaults to `file:./dev.db`
- `JWT_SECRET` - session signing secret, required in production
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - optional Google Sheets sync setting
- `GOOGLE_PRIVATE_KEY` - optional Google Sheets sync setting
- `GOOGLE_SHEETS_SPREADSHEET_ID` - optional Google Sheets sync setting

Create a `.env.local` file if you need to override any of them.

## Seeded Accounts

After running the seed script, you can log in with these demo accounts:

- Admin: `admin@coop.com` / `admin123`
- Manager: `manager@coop.com` / `manager123`
- Auditor: `auditor@coop.com` / `auditor123`
- Clerk: `clerk@coop.com` / `clerk123`

## Notes

- The database is SQLite-based, so the local database file is created automatically the first time you migrate or seed.
- If you reset the database, rerun the migration and seed commands above.

## Testing

1. Install dependencies and browsers.

```bash
npm install
npx playwright install --with-deps chromium
```

2. Run unit tests.

```bash
npm run test:unit
```

3. Run E2E tests.

```bash
npm run test:e2e
```

The E2E runner starts the development server automatically using Playwright `webServer` config.

Current automated coverage includes API route tests for auth, products (list and by-id), members (list, by-id, and purchases), inventory low-stock, sales (list, by-id, and summary), and users (by-id with password hashing), all with auth and failure-path coverage, plus E2E authentication success and failure scenarios.

4. Run the full local CI-equivalent matrix.

```bash
npm run test:ci
```

GitHub Actions CI is configured in `.github/workflows/ci.yml` and runs migration, seed, lint, build, unit tests, and E2E tests on pushes and pull requests.