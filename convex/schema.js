import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  assets: defineTable({
    symbol: v.string(),
    name: v.string(),
    quantity: v.number(),
    avgBuyPrice: v.number(),
    alertThresholdPercent: v.number(),
    lastPriceUsd: v.optional(v.number()),
    lastPriceCheckedAt: v.optional(v.number()),
    lastAlertAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_symbol", ["symbol"]),
  transactions: defineTable({
    assetId: v.id("assets"),
    type: v.union(v.literal("buy"), v.literal("sell"), v.literal("transfer")),
    quantity: v.number(),
    priceUsd: v.number(),
    timestamp: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_asset", ["assetId"])
    .index("by_timestamp", ["timestamp"]),
  alerts: defineTable({
    assetId: v.id("assets"),
    symbol: v.string(),
    priceUsd: v.number(),
    pctChange: v.number(),
    triggerType: v.string(),
    aiSummary: v.string(),
    createdAt: v.number(),
  })
    .index("by_asset", ["assetId"])
    .index("by_createdAt", ["createdAt"]),
})

