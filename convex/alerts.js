import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const listAlerts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(25)
  },
})

export const markAlertHandled = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.alertId)
  },
})

