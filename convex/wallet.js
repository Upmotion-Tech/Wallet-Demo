import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const listAssets = query({
  handler: async (ctx) => {
    const assets = await ctx.db.query("assets").collect()
    const augmented = assets.map((asset) => {
      const lastPrice = asset.lastPriceUsd ?? asset.avgBuyPrice
      const costBasis = asset.avgBuyPrice * asset.quantity
      const currentValue = lastPrice * asset.quantity
      const pctChange =
        asset.lastPriceUsd != null && asset.avgBuyPrice > 0
          ? ((asset.lastPriceUsd - asset.avgBuyPrice) / asset.avgBuyPrice) * 100
          : 0

      return {
        ...asset,
        costBasis,
        currentValue,
        pctChange,
        alertActive:
          Math.abs(pctChange) >= asset.alertThresholdPercent ? true : false,
      }
    })

    const totals = augmented.reduce(
      (acc, asset) => {
        acc.costBasis += asset.costBasis
        acc.currentValue += asset.currentValue
        return acc
      },
      { costBasis: 0, currentValue: 0 }
    )

    const pnl = totals.currentValue - totals.costBasis
    const pnlPct =
      totals.costBasis > 0 ? (pnl / totals.costBasis) * 100 : 0

    return {
      assets: augmented.sort((a, b) => b.createdAt - a.createdAt),
      summary: {
        totalCostBasis: totals.costBasis,
        totalValue: totals.currentValue,
        pnl,
        pnlPct,
      },
    }
  },
})

export const listTransactions = query({
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .collect()

    const assetsById = new Map()
    for (const asset of await ctx.db.query("assets").collect()) {
      assetsById.set(asset._id, asset)
    }

    return transactions.map((tx) => {
      const asset = assetsById.get(tx.assetId)
      return {
        ...tx,
        symbol: asset?.symbol ?? "N/A",
        name: asset?.name ?? "",
      }
    })
  },
})

export const upsertAsset = mutation({
  args: {
    symbol: v.string(),
    name: v.string(),
    quantity: v.number(),
    avgBuyPrice: v.number(),
    alertThresholdPercent: v.number(),
  },
  handler: async (ctx, args) => {
    const normalizedSymbol = args.symbol.toUpperCase()
    const existing = await ctx.db
      .query("assets")
      .withIndex("by_symbol", (q) => q.eq("symbol", normalizedSymbol))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        quantity: args.quantity,
        avgBuyPrice: args.avgBuyPrice,
        alertThresholdPercent: args.alertThresholdPercent,
      })
      return existing._id
    }

    return await ctx.db.insert("assets", {
      symbol: normalizedSymbol,
      name: args.name,
      quantity: args.quantity,
      avgBuyPrice: args.avgBuyPrice,
      alertThresholdPercent: args.alertThresholdPercent,
      createdAt: Date.now(),
    })
  },
})

export const addTransaction = mutation({
  args: {
    assetId: v.id("assets"),
    type: v.union(
      v.literal("buy"),
      v.literal("sell"),
      v.literal("transfer")
    ),
    quantity: v.number(),
    priceUsd: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("transactions", {
      ...args,
      timestamp: Date.now(),
    })
  },
})

export const seedDemoData = mutation({
  handler: async (ctx) => {
    const assetCount = await ctx.db.query("assets").collect()
    if (assetCount.length > 0) {
      return
    }

    const demoAssets = [
      {
        symbol: "BTCUSDT",
        name: "Bitcoin",
        quantity: 0.5,
        avgBuyPrice: 52000,
        alertThresholdPercent: 5,
      },
      {
        symbol: "ETHUSDT",
        name: "Ethereum",
        quantity: 3,
        avgBuyPrice: 3200,
        alertThresholdPercent: 7,
      },
      {
        symbol: "SOLUSDT",
        name: "Solana",
        quantity: 25,
        avgBuyPrice: 160,
        alertThresholdPercent: 10,
      },
    ]

    const assetIds = []
    for (const asset of demoAssets) {
      const newId = await ctx.db.insert("assets", {
        ...asset,
        createdAt: Date.now(),
      })
      assetIds.push({ id: newId, symbol: asset.symbol })
    }

    for (const entry of assetIds) {
      await ctx.db.insert("transactions", {
        assetId: entry.id,
        type: "buy",
        quantity: 1,
        priceUsd: 1000,
        timestamp: Date.now(),
        note: "Seed transaction",
      })
    }
  },
})

