---
name: deep-research
description: Multi-source deep research using the keenable, parallel, and exa search MCPs. Searches the web, synthesizes findings, and delivers cited reports with source attribution. Use when the user wants thorough research on any topic with evidence and citations.
origin: ECC
---

# Deep Research

Produce thorough, cited research reports from multiple web sources using the search MCP tools.

## When to Activate

- User asks to research any topic in depth
- Competitive analysis, technology evaluation, or market sizing
- Due diligence on companies, investors, or technologies
- Any question requiring synthesis from multiple sources
- User says "research", "deep dive", "investigate", or "what's the current state of"

## MCP Requirements

At least one of:
- **keenable** — `search_web_pages`, `fetch_page_content`. Keyless, 1000 req/hour.
- **parallel** — `web_search`, `web_fetch`. Keyless at lower rate limits.
- **exa** — `web_search_exa`, `web_fetch_exa`. Needs `EXA_API_KEY`.

Fallback when no MCP is available: the built-in `WebSearch` and `WebFetch`. They
work, but `WebSearch` is US-biased and ranks SEO aggregators above primary
sources — verify every number against the vendor's own page before quoting it.

Configure with `claude mcp add` at user scope, or in a project-scoped `.mcp.json`.
MCP servers live in `~/.claude.json`, **not** in `settings.json`. For Codex use
`~/.codex/config.toml`.

## Workflow

### Step 1: Understand the Goal

Ask 1-2 quick clarifying questions:
- "What's your goal — learning, making a decision, or writing something?"
- "Any specific angle or depth you want?"

If the user says "just research it" — skip ahead with reasonable defaults.

### Step 2: Plan the Research

Break the topic into 3-5 research sub-questions. Example:
- Topic: "Impact of AI on healthcare"
  - What are the main AI applications in healthcare today?
  - What clinical outcomes have been measured?
  - What are the regulatory challenges?
  - What companies are leading this space?
  - What's the market size and growth trajectory?

### Step 3: Execute Multi-Source Search

For EACH sub-question, search using available MCP tools:

**With keenable** (cheapest per call, snippet size is controllable):
```
search_web_pages(query: "<sub-question>", snippet_max_length: 500)
search_web_pages(query: "<sub-question>", published_after: "<ISO date ~12 months ago>")
```

**With parallel** (strongest on multi-step questions; returns ~28k chars per
call with no size knob, so spend it on the hard sub-questions, not on all of them):
```
web_search(objective: "<what you need to find>", search_queries: ["<3-6 word query>", "<variation>"])
```

**With exa** (semantic "find pages like this one" search):
```
web_search_exa(query: "<description of the ideal page>", numResults: 8)
```

**Search strategy:**
- Use 2-3 different keyword variations per sub-question
- Mix general and news-focused queries
- Aim for 15-30 unique sources total
- Prioritize: academic, official, reputable news > blogs > forums

### Step 4: Deep-Read Key Sources

For the most promising URLs, fetch full content:

**With keenable** (`prompt` makes the server extract only what you asked for,
instead of returning the whole page — the cheapest option by context):
```
fetch_page_content(url: "<url>", prompt: "<what to extract>")
fetch_page_content(url: "<url>", live: true)   # page not in the index yet
```

**With parallel** (up to 20 URLs per call; leave `full_content` off):
```
web_fetch(urls: ["<url>", ...], objective: "<what to extract, max 200 chars>")
```

**With exa:**
```
web_fetch_exa(url: "<url>")
```

Read 3-5 key sources in full for depth. Do not rely only on search snippets.

### Step 5: Synthesize and Write Report

Structure the report:

```markdown
# [Topic]: Research Report
*Generated: [date] | Sources: [N] | Confidence: [High/Medium/Low]*

## Executive Summary
[3-5 sentence overview of key findings]

## 1. [First Major Theme]
[Findings with inline citations]
- Key point ([Source Name](url))
- Supporting data ([Source Name](url))

## 2. [Second Major Theme]
...

## 3. [Third Major Theme]
...

## Key Takeaways
- [Actionable insight 1]
- [Actionable insight 2]
- [Actionable insight 3]

## Sources
1. [Title](url) — [one-line summary]
2. ...

## Methodology
Searched [N] queries across web and news. Analyzed [M] sources.
Sub-questions investigated: [list]
```

### Step 6: Deliver

- **Short topics**: Post the full report in chat
- **Long reports**: Post the executive summary + key takeaways, save full report to a file

## Parallel Research with Subagents

For broad topics, use Claude Code's Task tool to parallelize:

```
Launch 3 research agents in parallel:
1. Agent 1: Research sub-questions 1-2
2. Agent 2: Research sub-questions 3-4
3. Agent 3: Research sub-question 5 + cross-cutting themes
```

Each agent searches, reads sources, and returns findings. The main session synthesizes into the final report.

## Quality Rules

1. **Every claim needs a source.** No unsourced assertions.
2. **Cross-reference.** If only one source says it, flag it as unverified.
3. **Recency matters.** Prefer sources from the last 12 months.
4. **Acknowledge gaps.** If you couldn't find good info on a sub-question, say so.
5. **No hallucination.** If you don't know, say "insufficient data found."
6. **Separate fact from inference.** Label estimates, projections, and opinions clearly.

## Reference Sources

These define the bar for source quality and format. When research touches ML/LLM
topics, prefer sources of this caliber and actively hunt for more in the same
style: mechanism-first, honest about limits, reproducible details, clean visual
presentation.

| Source | Format | Why it sets the bar |
|---|---|---|
| [Digital Signals Theory](https://brianmcfee.net/dstbook-site/content/intro.html) — Brian McFee | interactive web textbook | Teaches from examples with runnable notebook code |
| [Inside GPU matmul](https://www.aleksagordic.com/blog/matmul) — Aleksa Gordic | long-form deep-dive | Mechanism-first walk from naive kernel to near-peak throughput |
| [How to Scale Your Model](https://jax-ml.github.io/scaling-book/index) — Google DeepMind | systems web book | First-principles arithmetic for scaling LLMs |
| [Model Evaluation, Model Selection, and Algorithm Selection](https://arxiv.org/abs/1811.12808) — Sebastian Raschka | methodology survey | Evaluation methodology with statistical grounding, not folklore |
| [The Multi-Armed Bandit Problem](https://lilianweng.github.io/posts/2018-01-23-multi-armed-bandit/) — Lilian Weng | long-form explainer | Precise math plus intuition plus clean figures |
| [Context reuse under the hood of Claude Code](https://blog.lmcache.ai/en/2025/12/23/context-engineering-reuse-pattern-under-the-hood-of-claude-code/) — LMCache | systems blog post | Reverse-engineers real production behavior instead of speculating |
| [DroPE: Dropping Positional Embeddings](https://arxiv.org/abs/2512.12167) — Sakana AI | research paper | Three observations, one simple method, broad empirical check |
| [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/) — Harvard NLP | annotated paper | Landmark paper annotated line-by-line with executable code |
| [Deep Learning Tuning Playbook](https://github.com/google-research/tuning_playbook) — Google Research | methodology playbook | Systematic experimental protocol for tuning |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) — Jay Alammar | visual explainer | Step-by-step visual decomposition of one architecture |
| [colah.github.io](https://colah.github.io) — Chris Olah | blog | Origin of the visual-explainer genre |
| [GPU Glossary](https://modal.com/gpu-glossary) — Modal | linked glossary | Coherent reference covering the full GPU stack |
| [PyTorch internals](https://blog.ezyang.com/2019/05/pytorch-internals/) — Edward Yang | core-dev deep-dive | Strides, dispatch, autograd explained by a maintainer |
| [Making Deep Learning Go Brrrr](https://horace.io/brrr_intro.html) — Horace He | perf essay | Compute/memory/overhead reasoning from first principles |
| [RLHF Book](https://rlhfbook.com) — Nathan Lambert | living web book | Full post-training pipeline in one maintained volume |
| [The Ultra-Scale Playbook](https://huggingface.co/spaces/nanotron/ultrascale-playbook) — HF nanotron | systems web book | GPU-parallelism counterpart to the scaling book |

## Examples

```
"Research the current state of nuclear fusion energy"
"Deep dive into Rust vs Go for backend services in 2026"
"Research the best strategies for bootstrapping a SaaS business"
"What's happening with the US housing market right now?"
"Investigate the competitive landscape for AI code editors"
```
