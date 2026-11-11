# PayPilot AI

Autonomous AI commerce and smart payments platform for the "Build What's Next with PayPal and AI" hackathon.
Users describe what they need; five tool-calling agents research, compare, budget and prepare a cart; the user approves; PayPal Sandbox takes the payment; the server verifies it.

**Stack:** React 18, TypeScript, Vite, Tailwind, React Router, Zustand, Recharts, Framer Motion (installed), Lucide, `@paypal/react-paypal-js` · Node, Express, TypeScript, MongoDB/Mongoose, JWT in HTTP-only cookies · Gemini or OpenAI function calling · PayPal Orders API v2 + Webhooks.

## Judges: quick start (about 5 minutes)
1. `cd server && cp .env.example .env`, set `JWT_SECRET` (any long random string) and optionally PayPal Sandbox keys and an AI key. A MongoDB is required (local, or an Atlas URI in `MONGODB_URI`; **MongoDB 4.2+**).
2. `npm install && npm run seed && npm run dev` (API on :4000). In another terminal: `cd client && npm install && npm run dev` (web on :5173).
3. Sign in as the seeded admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`) or register a user.
4. Without PayPal keys everything works except paying: checkout stops with a clear "PayPal sandbox credentials are not set" error. It never fakes a payment. Without an AI key the assistant runs in labelled **rules mode**.

Docs: [Architecture](docs/ARCHITECTURE.md) | [AI tools](docs/AI.md) | [PayPal](docs/PAYPAL.md) | [Demo video script](docs/DEMO_SCRIPT.md)

## Tests
```bash
cd server
npm run dev                 # terminal 1 (seeded DB)
npm run test:e2e            # terminal 2: 76 API checks (auth, RBAC, cart, checkout gate, AI, admin, spec aliases)
npm run test:payments       # starts its own API on :4001 and a LOCAL MOCK of PayPal: 47 payment-logic checks
npm run test:acceptance     # starts its own API + mock: 98 checks walking the 15 acceptance steps plus failed/cancelled/duplicate/unauthorized/invalid-amount/invalid-signature cases
```
`test:payments` uses `scripts/mock-paypal.mjs`, a test double. It validates our verification, idempotency and webhook logic, not PayPal itself.

## Run locally

Requirements: Node 18.18+, a MongoDB (local or Atlas), a PayPal developer account.

```bash
# 1. API
cd server
cp .env.example .env        # fill in JWT_SECRET, PayPal sandbox keys, optional AI key
npm install
npm run seed                # sample catalog + admin user (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                 # http://localhost:4000

# 2. Web (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :4000)
```

### PayPal Sandbox setup
1. developer.paypal.com > Apps & Credentials > Sandbox > create an app. Copy Client ID and Secret into `server/.env`.
2. Create a **webhook** on that app pointing to `https://<public-api-host>/api/webhooks/paypal` (use ngrok locally, or your Render URL). Subscribe to: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.DECLINED`, `PAYMENT.CAPTURE.REFUNDED`, `CHECKOUT.ORDER.APPROVED`. Put the Webhook ID in `PAYPAL_WEBHOOK_ID`.
3. Pay with a Sandbox *personal* (buyer) account from Sandbox > Accounts.

### AI setup
Set `GEMINI_API_KEY` (or `OPENAI_API_KEY`). Model names are env vars (`GEMINI_MODEL`, `OPENAI_MODEL`); check they are current for your account.
With no key the agents run in **rules mode**: same tools, same validation, deterministic text. The UI shows which mode produced each reply and an "Agent activity" trace of tools called.

## How it works

**Agents** (`server/src/agents.ts`): Shopping, Research, Comparison, Budget, Payment. Each has its own tool list and a zod-validated JSON output. Tools (`tools.ts`) read the real database. Research ids are checked against the DB and the budget is enforced as a hard filter, so a model cannot invent a product. Comparison and Budget run in parallel; numbers shown in the UI come from backend tools, not model text.

**Payment flow** (`payments.ts`, `routes.ts`):
1. Cart or assistant → `POST /api/checkout/prepare` creates an order (server totals, server FX conversion). Status `awaiting_approval`.
2. User ticks approval → `POST /api/orders/:id/approve {confirm:true}`. The server re-prices from the live catalog (409 `PRICE_CHANGED` if anything moved), then creates the PayPal order with a deterministic `PayPal-Request-Id`.
3. PayPal Buttons approve client-side → `POST /api/orders/:id/capture`. The server takes a per-order lock, captures, and checks status, amount, currency and `custom_id` against the order before marking it paid.
4. The webhook (`/api/webhooks/paypal`, raw body) verifies the signature via PayPal's verify API, stores the event id once (duplicates ignored; failures are deleted so PayPal retries), and reaches the same `markPaid`, which is atomic and idempotent.
5. Client-reported cancel/error events are only logged. They never change payment state.

**Spec endpoint map:** the spec's REST paths are all served. Some are aliases of the original routes: `/ai/chat` and `/ai/agent/run` = `/assistant/message`; `/paypal/create-order` = `/orders/:id/approve`; `/paypal/capture-order` = `/orders/:id/capture`; `/paypal/webhook` = `/webhooks/paypal`; `/preferences` (GET, PATCH); `/price-watch` (GET, POST, DELETE); `POST /wishlist`; `GET /products/search`; `POST /products/compare`; `/admin/analytics`, `/admin/users`, `/admin/ai-activity`.

**Security notes:** secrets only in env; no card data touched; bcrypt passwords; JWT in HTTP-only cookie; Helmet; rate limits on auth and chat; zod validation everywhere; agents cannot call PayPal, they can only prepare an order.

## Honest limitations
- The catalog is **sample data with fictional brands**. Replace it through the admin dashboard or your own import. The "performance index" spec is a sample value, not a benchmark.
- PayPal rarely settles INR, so the INR catalog is converted to `PAYPAL_CURRENCY` at the fixed `INR_PER_UNIT` rate. Use a live rate source for production.
- Price history contains only real recorded points (seed price, then admin price changes). Alerts fire from those changes.
- Refunds are **not** issued by the app. The assistant gives guidance, and a `PAYMENT.CAPTURE.REFUNDED` webhook is recorded if you refund in PayPal.
- **Verified:** server and client typecheck and build; 76 API checks, 47 mock-PayPal payment checks and 98 acceptance checks pass against a real MongoDB (4.0 with `mongoose@7` in the test environment).
- **Not verified:** a real PayPal Sandbox payment and webhook delivery, any real LLM provider (only rules mode was exercised), the React UI in a browser (it builds, but pages were not clicked through), and Mongoose 8 against MongoDB 4.2+. Do these before submitting:
  - [ ] One real Sandbox checkout reaches Paid
  - [ ] One real webhook shows in Admin > Overview > Webhook log
  - [ ] Assistant answers with your Gemini/OpenAI key
  - [ ] Click through Dashboard, Cart, Admin tabs

## Deploy
- **MongoDB Atlas:** create a cluster, set `MONGODB_URI`, run `npm run seed` once with it.
- **Render (API):** root `server`, build `npm install && npm run build`, start `npm start`. Set all `server/.env.example` variables, `NODE_ENV=production`, `CLIENT_URL=https://<your-vercel-domain>`.
- **Vercel (web):** root `client`. Edit `client/vercel.json` and replace `YOUR-RENDER-SERVICE` with your Render host. The rewrite keeps `/api` same-origin so the auth cookie stays first-party. Then register the webhook with the Render URL.
