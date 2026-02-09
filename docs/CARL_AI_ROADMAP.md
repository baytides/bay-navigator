# Carl AI Development Roadmap

## Overview

Carl is Bay Navigator's smart assistant, helping users find programs and resources. This document outlines planned enhancements for Carl AI.

---

## Current Architecture

### Azure VM (20.98.70.48)

| Service                 | Purpose                     | Status             |
| ----------------------- | --------------------------- | ------------------ |
| **Plausible Analytics** | Privacy-focused analytics   | Active             |
| **Temporal**            | Workflow orchestration      | Active             |
| **Langfuse**            | LLM observability & tracing | Active (Port 3000) |

### Mac Mini (via Cloudflare Tunnel)

| Service       | Purpose                           | Public URL            |
| ------------- | --------------------------------- | --------------------- |
| **Ollama**    | LLM inference (Carl AI)           | `ai.baytides.org`     |
| **Typesense** | Fast, typo-tolerant search engine | `search.baytides.org` |

### Langfuse Integration

**Added: February 2026**

Langfuse provides LLM observability for Carl:

- **Tracing**: Full conversation history with timing
- **Cost Tracking**: Token usage and API costs
- **Evaluation**: Score and improve responses
- **Prompt Management**: Version and A/B test prompts

Access: `http://20.98.70.48:3000` (internal)

### Typesense Search

**Added: February 2026** | **Migrated to Mac Mini: February 2026**

[Typesense](https://typesense.org/) provides fast, typo-tolerant search for programs:

- **Typo Tolerance**: Handles misspellings like "calfesh" → "CalFresh"
- **Faceted Search**: Filter by category, area, city, groups
- **Geo Search**: Find nearby programs by coordinates
- **Fast**: Sub-millisecond search latency

**Sync Script**: `scripts/sync-typesense.cjs` indexes all programs from YAML files. Runs automatically on deploy via GitHub Actions.

```bash
# Re-sync after data changes
TYPESENSE_API_KEY=<key> node scripts/sync-typesense.cjs
```

**Azure Function**: `/api/search` proxies requests to Typesense at `search.baytides.org` (keeps API key secure).

---

## Planned Enhancements

### Phase 1: Voice Interface (LiveKit)

**Priority: High**
**Status: Researched, Not Started**

#### What is LiveKit?

[LiveKit](https://livekit.io/) is an open-source platform for real-time voice, video, and AI agents. It would enable:

- **"Talk to Carl"** - Voice conversations instead of text
- **Phone Integration** - Carl accessible via phone number (SIP/telephony)
- **Low Latency** - Real-time streaming for natural conversation
- **Accessibility** - Better experience for users who prefer voice

#### Technical Requirements

- Self-hosted LiveKit server on Azure VM
- Speech-to-Text (STT) integration (Azure Speech or Whisper)
- Text-to-Speech (TTS) integration (Azure Speech or ElevenLabs)
- LiveKit Agents SDK for voice AI logic

#### Resources

- [LiveKit Self-Hosting Docs](https://docs.livekit.io/transport/self-hosting/local/)
- [LiveKit Agents Framework](https://github.com/livekit/agents)
- [LiveKit Cloud](https://livekit.io/) (managed alternative)

#### Implementation Steps

1. [ ] Set up LiveKit server on Azure VM
2. [ ] Configure STT/TTS providers
3. [ ] Build voice agent using LiveKit Agents SDK
4. [ ] Create "Voice Mode" toggle in Bay Navigator UI
5. [ ] Add phone number support (optional)
6. [ ] Test accessibility with screen readers

#### Estimated Effort

- Infrastructure setup: 1-2 days
- Voice agent development: 3-5 days
- UI integration: 2-3 days
- Testing: 2-3 days

---

### Phase 2: Enhanced Context

**Priority: Medium**

- **Location Awareness**: Suggest nearby programs automatically
- **Conversation History**: Remember past interactions (with consent)
- **Proactive Suggestions**: "Did you know about this related program?"

---

### Phase 3: Multi-Modal Support

**Priority: Low**

- **Image Upload**: "What benefits might this document qualify me for?"
- **Form Assistance**: Help fill out benefit applications
- **Document Summarization**: Explain complex eligibility requirements

---

## Infrastructure Notes

### Azure VM Specifications

- **OS**: Ubuntu 24.04 LTS
- **Location**: West US
- **Docker**: v29.2.0
- **Docker Compose**: v5.0.2

### Port Allocations

| Port | Service                       |
| ---- | ----------------------------- |
| 3000 | Langfuse Web UI               |
| 3030 | Langfuse Worker               |
| 8080 | Plausible Analytics           |
| 8108 | Typesense Search              |
| 9090 | MinIO (S3-compatible storage) |

### Security Considerations

- All database ports (PostgreSQL, Redis, ClickHouse) bound to localhost only
- External access only for web UIs
- Consider adding Caddy/nginx reverse proxy with SSL

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for general contribution guidelines.

For Carl AI specifically:

- AI/ML changes should be tested with representative queries
- Voice features need accessibility review
- All LLM calls should be traced in Langfuse
