# MarketSense AI

**Intelligent Market Intelligence Crawler**

An end-to-end pipeline that goes far beyond web scraping. MarketSense AI combines automated crawling with LLM-powered analysis to transform raw web pages into structured, quality-reviewed market intelligence -- from research brief generation through actionable insights delivery.

## 📋 Quick Summary

> 🧠 **MarketSense AI** 是一套端到端的智慧市場情報管線，遠超傳統網頁爬蟲的範疇。🔬 核心流程由 LLM 驅動——從自動生成研究簡報、規劃目標 URL、隱匿式網頁抓取、結構化資訊萃取，到品質評分與二次優化，全程自動化。🕷️ 爬蟲層採用 Playwright 搭配反偵測外掛（stealth plugins），能處理 JavaScript 渲染、反機器人防護與動態內容。🤖 雙層 LLM 分析架構：第一層萃取痛點、情緒信號、競爭定位與可行洞察；第二層進行品質評分、噪音過濾與弱結果增強。📋 支援 Firestore 分散式任務佇列（入隊、租約、回收），以及安全探測測試預判封鎖率。⚡ Express.js API 伺服器可獨立運作，接收品牌設定即回傳結構化行銷情報。📊 輸出格式涵蓋 JSON、CSV 與互動式儀表板。🛠️ 技術棧融合 Python 管線核心、Node.js API 層與 Firebase 後端。💡 將過去研究團隊需要數天完成的市場調研，壓縮為單一指令即可執行的自動化流程。

---

## 💡 Why This Exists

Market research still relies heavily on manual browsing, reading, and summarizing. MarketSense AI automates the entire intelligence pipeline: an LLM generates the research brief, a stealth crawler collects the data, another LLM pass extracts structured insights, and a quality review layer scores and filters the results. What used to take a research team days runs as a single pipeline command.

## 🏗️ Architecture

```
Research Brief (Brand + Product + Objective)
        |
        v
LLM Brief Generator --> URL Planner (auto-search)
        |
        v
  url.txt (curated target URLs)
        |
        v
Playwright Stealth Crawler (anti-detection plugins)
        |
        v
  raw_html/ (cached full pages)
        |
        v
LLM Analyzer (structured extraction)
        |
        v
LLM Quality Review (scoring + second-pass optimization)
        |
        v
Structured Output (JSON / CSV / Dashboard)
```

### Pipeline Stages

1. **Brief Generation** -- Given a brand, product, and business objective, the LLM generates a research brief outlining what intelligence to collect and why.
2. **URL Planning** -- Automatically searches the web and curates a target URL list relevant to the brief.
3. **Stealth Crawling** -- Playwright with stealth plugins (`playwright-extra`, `puppeteer-extra-plugin-stealth`) navigates target pages, handling JavaScript rendering, anti-bot measures, and dynamic content. Pages are cached locally in `raw_html/`.
4. **LLM Analysis** -- Each collected page is processed by an LLM to extract pain points, sentiment signals, competitive positioning, and actionable insights as structured JSON.
5. **Quality Review** -- A second LLM pass scores extracted data for relevance and accuracy, filters noise, and enriches weak results.
6. **Reporting** -- Results export as JSON/CSV or feed into the companion Brand Sentiment Dashboard.

### Key Capabilities

- LLM-driven research brief generation (interactive or fully automatic)
- Automated URL discovery and curation via web search
- Anti-detection crawling with Playwright stealth plugins
- Firestore-backed distributed task queue (enqueue, lease, reclaim)
- Two-pass LLM analysis: extraction then quality scoring
- Safety probe testing (measure block rates before committing to full crawl)
- Maintenance utilities: lock reclamation, error requeue, stale job cleanup
- One-command full pipeline execution
- JSON, CSV, and dashboard report outputs

### Crawler API Server

The `crawler-api/` module also serves as a standalone Express API that combines crawling with real-time AI analysis. Send a brand configuration and receive structured marketing intelligence:

```
POST /api/analyze
  { brandName, tagline, targetAudience, keywords, tone }
        |
        v
  LLM generates: pain points, emotion distribution,
  trends, language style, marketing recommendations
```

## 🛠️ Tech Stack

- **Crawling**: Playwright with playwright-extra and stealth plugins
- **LLM Integration**: MiniMax / OpenAI-compatible API (configurable)
- **API Server**: Express.js (Node.js)
- **Task Queue**: Google Cloud Firestore
- **Pipeline Core**: Python
- **Configuration**: dotenv

## 🏁 Quick Start

### Crawler API (Node.js)

```bash
cd crawler-api
npm install
npx playwright install chromium

# Configure environment
cp .env.example .env
# Set your LLM API key in .env

# Start the API server
npm start
# Runs on http://localhost:3002
```

### Full Python Pipeline

```bash
# Setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r python/marketsense/requirements.txt
playwright install

# Configure
cp python/marketsense/.env.example python/marketsense/.env

# Run complete pipeline in one command
PYTHONPATH=python python -m marketsense.run_pipeline \
  --env-file python/marketsense/.env \
  --urls-file urls.txt \
  --use-firestore \
  --quality-review \
  --brand "Your Brand" \
  --product "Your Product" \
  --objective "Your Objective"
```

### Individual Steps

```bash
# Generate research brief
PYTHONPATH=python python -m marketsense.main_brief \
  --env-file python/marketsense/.env \
  --brand "Brand" --product "Product" --objective "Goal"

# Plan target URLs from brief
PYTHONPATH=python python -m marketsense.main_url_planner \
  --env-file python/marketsense/.env \
  --report-file brief_report.json --output url.txt --auto-search

# Crawl targets
PYTHONPATH=python python -m marketsense.main_crawler \
  --env-file python/marketsense/.env --urls-file urls.txt

# Analyze collected pages
PYTHONPATH=python python -m marketsense.main_analyzer \
  --env-file python/marketsense/.env --limit 50

# Quality review pass
PYTHONPATH=python python -m marketsense.main_quality_review \
  --env-file python/marketsense/.env --limit 50 \
  --brand "Brand" --product "Product" --objective "Goal"

# Generate reports
PYTHONPATH=python python -m marketsense.main_report \
  --env-file python/marketsense/.env \
  --output-json report.json --output-csv report.csv

# Launch dashboard
PYTHONPATH=python python -m marketsense.main_dashboard \
  --env-file python/marketsense/.env --limit 200
```

## 📁 Project Structure

```
marketsense-ai/
  crawler-api/
    server.js              # Express API: crawling + LLM analysis endpoints
    package.json           # Node.js dependencies (Playwright, stealth, Express)
  raw_html/                # Cached crawled pages
  url.txt                  # Target URL list (auto-generated or manual)
  start-crawler.sh         # Shell convenience launcher
  QUICK_START.md           # Detailed usage guide with all pipeline commands
```

---

Built by **Huang Akai (Kai)** -- Founder @ Universal FAW Labs | Creative Technologist | Ex-Ogilvy
