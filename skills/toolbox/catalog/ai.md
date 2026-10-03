# AI features

Checked 2026-10-03. Plugins are `@claude-plugins-official` unless noted.

| Need | Pick | Why / watch out | Add it |
|---|---|---|---|
| Chat, writing, extraction, vision, tool use in the app | **Claude API** (Anthropic SDK) | Current model ids, pricing, caching, streaming are in the skill; never answer those from memory | `claude-api@anthropic-agent-skills` (global) |
| An agent that runs tools on its own | **Claude Agent SDK** | Same harness as Claude Code | `agent-sdk-dev` plugin |
| Give Luna or another app new tools | Build an **MCP server** | One server, usable from Claude, Luna and Claude Code | `mcp-server-dev` plugin; ECC skill `mcp-server-patterns` |
| Local / private model | **Ollama** (what Luna uses) | No per-token cost; slower, weaker | Docker service |
| Search over your own docs (RAG) | Small: SQLite + `sqlite-vec`, or Postgres `pgvector`. Large: **Qdrant** or **Pinecone** | Start in the DB you already have | `qdrant-skills` / `pinecone` plugins |
| Multimodal data pipelines | **Pixeltable** | Tables with computed columns over images/video/audio | `pixeltable` plugin |
| Other open models (image, audio, video, embeddings) | **Together AI** or fal.ai | | `togetherai-skills` plugin; see video-audio.md |
| Traces, prompt versions, evals, cost per user | **Langfuse** | Needed once real users hit the LLM | `langfuse` plugin |
| Keep LLM spend down | Model routing + prompt caching + budgets | | ECC skill `cost-aware-llm-pipeline` |
| Voice agent (phone or app) | Synthflow, or Twilio + STT/TTS | | `synthflow` / `twilio-developer-kit` plugins |
| Prompt and agent quality checks | Eval harness | | ECC skills `eval-harness`, `ai-regression-testing` |

Rules: keys only on the server; treat model output and fetched web text as untrusted data;
log token cost per user before launch so pricing covers it.
