# Data, web, browser, 3D

Checked 2026-10-03. Plugins are `@claude-plugins-official` unless noted.

| Need | Pick | Why / watch out | Add it |
|---|---|---|---|
| Web search inside the app | **Exa** or **Tavily** | Neural search, clean results for LLMs | `exa` / `tavily` plugins; ECC skill `exa-search` |
| Turn sites into clean markdown / structured data | **Firecrawl** | Keyless endpoint has 3 tools; key for the full set | `firecrawl` plugin |
| Big or protected scraping jobs | Bright Data, Zyte | Respect robots.txt and terms | `brightdata-plugin` / `zyte-web-data` plugins |
| Scheduled data collector | | | ECC skill `data-scraper-agent` |
| Browser automation, e2e tests, screenshots | **Playwright** | Already global | global `playwright` plugin, `ui-review` skill |
| Use yskills' logged-in Chrome | Claude in Chrome (`claude --chrome`) | Needs the extension and a Pro/Max login | built in |
| Analyse CSV / Parquet / JSON files | **DuckDB** | | `duckdb-skills` plugin |
| 3D on the web | **Three.js** (MyPage) | | npm |
| 2D games | **PixiJS** (TiktokIsland) | | npm |
| Maps, geocoding, routing | MapLibre + OpenStreetMap, or Amazon Location | | npm; `amazon-location-service` plugin |
| Design files | **Figma**, **Canva** | Pull frames, export assets | `figma` / `canva` plugins |
| Slides and pitch decks | | | ECC skills `frontend-slides`, `investor-materials` |
