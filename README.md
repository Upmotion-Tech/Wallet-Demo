## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create `.env.local` and add:

   ```
   VITE_CONVEX_URL="https://<your-convex-deployment>.convex.cloud"
   OPENROUTER_API_KEY="sk-or-..."
   ```

   - Run `npx convex dev` once to authenticate and obtain the dev deployment URL printed in the CLI.
   - Generate a free OpenRouter key at https://openrouter.ai.

3. **Start Convex + Vite**

   ```bash
   # Terminal 1
   npm run convex

   # Terminal 2
   npm run dev
   ```

   Open http://localhost:5173.

4. **Seed demo wallet (optional)**

   Use the “Seed sample data” button inside the UI to insert BTC/ETH/SOL holdings plus a few transactions.

## Alert Rule & Notifications

- Every asset stores `alertThresholdPercent`.
- During each cron run (or manual trigger), Binance prices are fetched and compared to the asset’s average buy price.
- If `abs(pctMove) >= threshold` and the asset has not alerted in the last 30 minutes, an alert record is inserted along with a generated AI summary.
- The notification feed and the “Alert log” tab both read from the same Convex `alerts` table.

## Architecture Notes

- **Convex actions** handle external network requests (Binance + OpenRouter) while mutations/queries stay pure.
- **Convex cron** (`convex/crons.js`) schedules `alerts:runPriceChecks` every five minutes.
- **UI** relies on `convex/react` hooks (`useQuery`, `useMutation`, `useAction`) for live updates.
- **shadcn/ui** ensures a cohesive design system with Tailwind CSS tokens and components.

## Testing the Flow

1. Seed demo data or add custom assets with alert thresholds.
2. Click “Run price check” to fetch fresh Binance prices immediately.
3. When the configured rule fires, the notification panel will display:
   - Symbol, last price, percentage move.
   - AI-generated commentary explaining why the alert mattered plus a suggestion.
4. Leave the Convex dev server running to execute cron-based checks automatically.

## Loom Walkthrough

Record a short Loom (or similar) covering:

1. High-level architecture and data flow (Convex schema, cron, AI action).
2. Live demonstration of the dashboard, adding assets, and alert generation.
3. Any noteworthy implementation details or trade-offs.
