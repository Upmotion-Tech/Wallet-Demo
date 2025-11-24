import { cronJobs } from "convex/server"

const crons = cronJobs()

crons.interval(
  "refresh-wallet-prices",
  { minutes: 5 },
  "alertActions:runPriceChecks"
)

export default crons

