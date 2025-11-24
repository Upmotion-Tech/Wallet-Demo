import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import "./index.css"
import App from "./App.jsx"

const convexUrl = import.meta.env.VITE_CONVEX_URL
const convexClient = convexUrl
  ? new ConvexReactClient(convexUrl)
  : null

export function MissingConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">
          Convex endpoint missing
        </h1>
        <p className="text-muted-foreground">
          Set <code className="rounded bg-muted px-1 py-0.5">VITE_CONVEX_URL</code> in
          your <code>.env.local</code> file. Run{" "}
          <code className="rounded bg-muted px-1 py-0.5">npx convex dev</code> to obtain
          the development deployment URL.
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <App />
      </ConvexProvider>
    ) : (
      <MissingConfig />
    )}
  </StrictMode>
)
