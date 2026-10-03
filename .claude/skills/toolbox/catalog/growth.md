# Growth: analytics, SEO, social, email

Checked 2026-10-03. Plugins are `@claude-plugins-official` unless noted.

| Need | Pick | Why / watch out | Add it |
|---|---|---|---|
| Product analytics, funnels, session replay, feature flags | **PostHog** (EU cloud) | Plugin is ~30k tokens: per project only | `posthog` plugin; MCP `https://mcp.posthog.com/mcp` |
| Simple, cookieless page analytics | **Plausible** or **Umami** | No consent banner needed for analytics alone | script tag |
| A/B tests | **GrowthBook** or PostHog experiments | | `growthbook` plugin |
| Error tracking | **Sentry** | | `sentry` plugin |
| SEO (technical, content, structured data) | | | agent `seo-specialist` and ECC skill `seo` (both global) |
| Social posting and scheduling | **Postiz** | 13+ platforms, analytics | `postiz` plugin; ECC skills `social-publisher`, `crosspost`, `x-api` |
| Content plan, scripts, threads | | | ECC skills `content-engine`, `brand-voice` |
| Marketing campaigns, landing copy, ad copy | | | ECC skill `marketing-campaign` |
| Transactional email (login links, receipts) | **Resend** | Simple API, React/HTML templates | `resend` plugin |
| Marketing email / newsletters | Resend audiences, or ActiveCampaign | Needs double opt-in in Germany | `activecampaign` plugin |
| Conversion tracking for ads | Meta Pixel / Conversions API, TikTok Pixel, Google tag | Only after consent; server-side events are more reliable | tags via consent manager |
| Report numbers into Luna | Small read-only API or webhook into Luna's cockpit | Luna is the one dashboard for all projects | see luna-monorepo connectors |
