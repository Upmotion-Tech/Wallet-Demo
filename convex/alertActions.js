"use node"

import { Spot } from "@binance/connector"
import { action } from "./_generated/server"
import { v } from "convex/values"
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const ALERT_COOLDOWN_MS = 30 * 60 * 1000
const openRouterModel = "meta-llama/llama-3.1-8b-instruct:free"

async function createAiSummary({ symbol, priceUsd, pctChange, threshold }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return `Alert for ${symbol}: price is $${priceUsd.toFixed(
      2
    )} with a ${pctChange.toFixed(
      2
    )}% move. Configure OPENROUTER_API_KEY for AI commentary.`
  }

  try {
    const client = createOpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    })

    const result = await generateText({
      model: client(openRouterModel),
      prompt: `You are a helpful crypto portfolio assistant. Explain in less than 4 sentences why ${symbol} moving ${pctChange.toFixed(
        2
      )}% relative to the owner's average cost might matter. Mention the alert rule of ${threshold}% and suggest one actionable tip.`,
    })

    return result.text
  } catch (error) {
    console.error("AI summary failed", error)
    return `AI summary unavailable (${error.message}).`
  }
}

async function fetchTickerPrice(symbol) {
  const client = new Spot(undefined, undefined, {
    baseURL: "https://api.binance.com",
  })
  const response = await client.tickerPrice(symbol)
  if (!response?.data?.price) {
    throw new Error(`No price returned for ${symbol}`)
  }
  return parseFloat(response.data.price)
}

export const runPriceChecks = action({
  args: {
    symbols: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let assets = await ctx.db.query("assets").collect()

    if (args.symbols?.length) {
      const lookup = new Set(args.symbols.map((s) => s.toUpperCase()))
      assets = assets.filter((asset) => lookup.has(asset.symbol))
    }

    if (assets.length === 0) {
      return { processed: 0, alerts: [] }
    }

    const alertsTriggered = []

    for (const asset of assets) {
      try {
        const priceUsd = await fetchTickerPrice(asset.symbol)
        const pctChange =
          asset.avgBuyPrice > 0
            ? ((priceUsd - asset.avgBuyPrice) / asset.avgBuyPrice) * 100
            : 0

        await ctx.db.patch(asset._id, {
          lastPriceUsd: priceUsd,
          lastPriceCheckedAt: now,
        })

        const shouldAlert =
          Math.abs(pctChange) >= asset.alertThresholdPercent &&
          (!asset.lastAlertAt || now - asset.lastAlertAt > ALERT_COOLDOWN_MS)

        if (!shouldAlert) {
          continue
        }

        const aiSummary = await createAiSummary({
          symbol: asset.symbol,
          priceUsd,
          pctChange,
          threshold: asset.alertThresholdPercent,
        })

        await ctx.db.patch(asset._id, { lastAlertAt: now })

        const alertId = await ctx.db.insert("alerts", {
          assetId: asset._id,
          symbol: asset.symbol,
          priceUsd,
          pctChange,
          triggerType: `abs(move) >= ${asset.alertThresholdPercent}%`,
          aiSummary,
          createdAt: now,
        })

        alertsTriggered.push({
          assetId: asset._id,
          alertId,
          priceUsd,
          pctChange,
        })
      } catch (error) {
        alertsTriggered.push({
          assetId: asset._id,
          error: error.message,
        })
      }
    }

    return {
      processed: assets.length,
      alerts: alertsTriggered,
    }
  },
})

