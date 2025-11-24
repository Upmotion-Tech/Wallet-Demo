import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bell,
  Brain,
  DatabaseZap,
  Loader2,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./index.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatPct(value) {
  if (Number.isNaN(value)) return "0.00%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function EmptyState({ onSeed, isSeeding }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5 text-primary" />
          No assets yet
        </CardTitle>
        <CardDescription>
          Seed the Convex database with demo holdings or add your own asset to
          get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <Button onClick={onSeed} disabled={isSeeding}>
          {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Load sample wallet
        </Button>
        <span className="text-sm text-muted-foreground">
          Demo data includes BTC, ETH, and SOL positions plus example
          transactions.
        </span>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ title, value, subtext, icon, accent }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("rounded-full p-2", accent)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function AssetTable({ assets }) {
  if (!assets.length) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Assets will show up here once added to the wallet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Avg. Buy</TableHead>
          <TableHead className="text-right">Last Price</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset._id}>
            <TableCell className="font-semibold">
              <div className="flex flex-col">
                <span>{asset.symbol}</span>
                <span className="text-xs text-muted-foreground">
                  {asset.name}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              {asset.quantity.toFixed(4)}
            </TableCell>
            <TableCell className="text-right">
              {currency.format(asset.avgBuyPrice)}
            </TableCell>
            <TableCell className="text-right">
              {asset.lastPriceUsd ? currency.format(asset.lastPriceUsd) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {currency.format(asset.currentValue)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-medium",
                asset.pctChange > 0 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {formatPct(asset.pctChange)}
            </TableCell>
            <TableCell>
              <Badge variant={asset.alertActive ? "destructive" : "secondary"}>
                {asset.alertActive ? "Alert" : "Stable"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AlertFeed({ alerts }) {
  if (!alerts?.length) {
    return (
      <div className="text-muted-foreground text-sm">
        Alerts will be listed once the threshold rule is triggered.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[360px] pr-4">
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert._id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">{alert.symbol}</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span>
                Price: <strong>{currency.format(alert.priceUsd)}</strong>
              </span>
              <span
                className={cn(
                  alert.pctChange > 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                Move: {formatPct(alert.pctChange)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {alert.aiSummary}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function TransactionTable({ transactions }) {
  if (!transactions?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No transactions recorded yet.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx._id}>
              <TableCell className="font-medium">{tx.symbol}</TableCell>
              <TableCell className="capitalize">{tx.type}</TableCell>
              <TableCell>{tx.quantity}</TableCell>
              <TableCell>{currency.format(tx.priceUsd)}</TableCell>
              <TableCell className="text-muted-foreground">
                {tx.note ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function RuleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alert rule
        </CardTitle>
        <CardDescription>
          Each asset defines a % move threshold measured against its cost basis.
          When the absolute move exceeds the threshold, a notification is
          generated with an AI summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <ul className="list-disc space-y-2 pl-4">
          <li>Price data fetched from Binance Spot public ticker API.</li>
          <li>
            Checks run every 5 minutes via Convex cron (plus manual trigger).
          </li>
          <li>Alerts are rate-limited to once every 30 minutes per asset.</li>
        </ul>
        <Separator />
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
          <Brain className="h-4 w-4" />
          Vercel AI SDK + OpenRouter produce the commentary used inside
          notifications.
        </div>
      </CardContent>
    </Card>
  );
}

function AddAssetForm({ onSubmit, isSubmitting }) {
  const [inputs, setInputs] = useState({
    symbol: "",
    name: "",
    quantity: "",
    avgBuyPrice: "",
    alertThresholdPercent: 5,
    note: "",
    autoRunCheck: true,
  });
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const payload = {
      symbol: inputs.symbol.trim(),
      name: inputs.name.trim() || inputs.symbol.trim(),
      quantity: Number(inputs.quantity),
      avgBuyPrice: Number(inputs.avgBuyPrice),
      alertThresholdPercent: Number(inputs.alertThresholdPercent),
    };

    try {
      await onSubmit(payload, inputs);
      setInputs({
        symbol: "",
        name: "",
        quantity: "",
        avgBuyPrice: "",
        alertThresholdPercent: inputs.alertThresholdPercent,
        note: "",
        autoRunCheck: inputs.autoRunCheck,
      });
      setMessage("Asset saved");
    } catch (error) {
      setMessage(error.message ?? "Failed to save asset");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            placeholder="BTCUSDT"
            value={inputs.symbol}
            onChange={(e) => updateField("symbol", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Bitcoin"
            value={inputs.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            step="0.0001"
            min="0"
            value={inputs.quantity}
            onChange={(e) => updateField("quantity", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avgBuyPrice">Avg. Buy Price (USD)</Label>
          <Input
            id="avgBuyPrice"
            type="number"
            step="0.01"
            min="0"
            value={inputs.avgBuyPrice}
            onChange={(e) => updateField("avgBuyPrice", e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="threshold">Alert Threshold (%)</Label>
          <Input
            id="threshold"
            type="number"
            min="1"
            step="1"
            value={inputs.alertThresholdPercent}
            onChange={(e) =>
              updateField("alertThresholdPercent", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Internal note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Why you hold this asset…"
            value={inputs.note}
            onChange={(e) => updateField("note", e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Run price check immediately</p>
          <p className="text-xs text-muted-foreground">
            Useful after adding a new position.
          </p>
        </div>
        <Switch
          checked={inputs.autoRunCheck}
          onCheckedChange={(checked) => updateField("autoRunCheck", checked)}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save asset
        </Button>
        {message && <span>{message}</span>}
      </div>
    </form>
  );
}

function App() {
  const wallet = useQuery("wallet:listAssets");
  const transactions = useQuery("wallet:listTransactions");
  const alerts = useQuery("alerts:listAlerts");
  const seedDemo = useMutation("wallet:seedDemoData");
  const upsertAsset = useMutation("wallet:upsertAsset");
  const runPriceChecks = useAction("alertActions:runPriceChecks");

  const [isSeeding, setIsSeeding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false);

  const assets = wallet?.assets ?? [];
  const summary = wallet?.summary;

  const utilization = useMemo(() => {
    if (!summary) return 0;
    const total = summary.totalCostBasis;
    if (total === 0) return 0;
    const gain = summary.pnl;
    return Math.min(100, Math.max(0, ((gain + total) / total) * 10));
  }, [summary]);

  async function handleSeed() {
    setIsSeeding(true);
    try {
      await seedDemo();
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleManualCheck() {
    setIsChecking(true);
    try {
      await runPriceChecks({});
    } finally {
      setIsChecking(false);
    }
  }

  async function handleAssetSubmit(payload, inputs) {
    setIsSavingAsset(true);
    try {
      await upsertAsset(payload);
      if (inputs.autoRunCheck) {
        await runPriceChecks({ symbols: [payload.symbol] });
      }
    } finally {
      setIsSavingAsset(false);
    }
  }

  const isLoading = !wallet;

  return (
    <TooltipProvider delayDuration={0}>
      <main className="min-h-screen bg-muted/20 pb-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Wallet Management
                </p>
                <h1 className="text-3xl font-semibold">Convex Binance</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSeed}
                  disabled={isSeeding}
                >
                  {isSeeding && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Seed sample data
                </Button>
                <Button
                  onClick={handleManualCheck}
                  disabled={isChecking || assets.length === 0}
                >
                  {isChecking && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run price check
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Tracks wallet holdings in Convex, polls Binance for real-time
              prices, evaluates a shared alert rule, and enriches notifications
              with AI commentary.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="animate-pulse space-y-4 p-6">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-8 w-1/2 rounded bg-muted" />
                </Card>
              ))}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState onSeed={handleSeed} isSeeding={isSeeding} />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  title="Portfolio value"
                  value={summary ? currency.format(summary.totalValue) : "—"}
                  subtext={
                    summary
                      ? `Cost basis ${currency.format(summary.totalCostBasis)}`
                      : "—"
                  }
                  icon={<Wallet className="h-4 w-4" />}
                  accent="bg-primary/10 text-primary"
                />
                <SummaryCard
                  title="Unrealized P&L"
                  value={summary ? currency.format(summary.pnl) : "—"}
                  subtext={summary ? formatPct(summary.pnlPct) : "—"}
                  icon={<Sparkles className="h-4 w-4" />}
                  accent="bg-emerald-100 text-emerald-700"
                />
                <SummaryCard
                  title="Alert coverage"
                  value={`${assets.filter((a) => a.alertActive).length}/${assets.length}`}
                  subtext="assets breaching threshold"
                  icon={<Bell className="h-4 w-4" />}
                  accent="bg-amber-100 text-amber-700"
                />
                <SummaryCard
                  title="Scorecard"
                  value={`${Math.round(utilization)} pts`}
                  subtext="health score (demo)"
                  icon={<Brain className="h-4 w-4" />}
                  accent="bg-indigo-100 text-indigo-700"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Wallet breakdown
                    </CardTitle>
                    <CardDescription>
                      Live valuations based on the latest Binance price.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssetTable assets={assets} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Notifications
                    </CardTitle>
                    <CardDescription>
                      AI-enriched alerts when the shared rule fires.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertFeed alerts={alerts} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Add or update an asset</CardTitle>
                    <CardDescription>
                      Persisted in Convex with your custom alert threshold.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AddAssetForm
                      onSubmit={handleAssetSubmit}
                      isSubmitting={isSavingAsset}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Portfolio pulse
                    </CardTitle>
                    <CardDescription>
                      Demo indicator for capital deployment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Deployment</span>
                        <span>{Math.round(utilization)}%</span>
                      </div>
                      <Progress value={utilization} />
                    </div>
                    <RuleCard />
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="alerts">Alert log</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction history</CardTitle>
                      <CardDescription>
                        Synchronized with Convex wallet entries.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TransactionTable transactions={transactions} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="alerts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent alerts</CardTitle>
                      <CardDescription>
                        Same data powering the notification feed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertFeed alerts={alerts} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </TooltipProvider>
  );
}

export default App;
