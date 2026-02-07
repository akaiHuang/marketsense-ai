# 快速開始指南

## 🎯 5分鐘快速上手

### 步驟 1: 環境準備

確保已安裝:
```bash
# 檢查 Node.js (需要 18+)
node --version

# 檢查 npm
npm --version

# 檢查 Copilot CLI
copilot --version
```

如果 Copilot CLI 未安裝:
```bash
# 安裝 GitHub Copilot CLI
# 參考: https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli
```

### 步驟 2: 安裝依賴

```bash
cd /Users/akaihuangm1/Desktop/2_好口碑

# 安裝專案依賴
npm install
```

### 步驟 3: 運行第一個範例

```bash
# 運行多代理協調範例
npm start
```

你將看到:
```
================================================================================
🚀 啟動多代理開發流程
================================================================================

[步驟 1] 監工正在分析專案需求...
📋 [監工]: 我已經分析了需求,將其分解為 5 個任務...

[步驟 2] 開始開發任務...
💻 [開發者]: 開始實現任務 T1: 設計用戶認證模組...

[步驟 3] 開始測試流程...
🧪 [測試]: 為認證模組生成測試...

[步驟 4] 監工檢查專案狀態...
📊 專案完成率: 100%
```

## 📚 範例說明

### 範例 1: 多代理協調 (推薦新手)

**用途**: 展示完整的多代理協作流程

**運行方式**:
```bash
npm start
# 或
npx tsx examples/multi-agent-workflow.ts
```

**你會看到**:
- 監工代理分析需求並分解任務
- 開發者代理執行開發任務
- 測試代理執行測試
- 完整的進度報告

**適合場景**: 學習多代理如何協作

---

### 範例 2: 並行開發

**用途**: 展示多個代理並行工作

**運行方式**:
```bash
npm run parallel
# 或
npx tsx examples/parallel-development.ts
```

**你會看到**:
- 4 個專門化代理同時工作
- 前端、後端、資料庫、測試並行執行
- 實時進度追蹤
- 最終統一報告

**適合場景**: 需要快速完成多個獨立任務

---

### 範例 3: Next.js 自動化測試

**用途**: 為 Next.js 專案自動生成和執行測試

**運行方式**:
```bash
npm run test:auto
# 或
npx tsx examples/nextjs-test-automation.ts ./your-nextjs-project
```

**你會看到**:
- 自動生成測試代碼
- 執行測試套件
- 分析失敗原因
- 自動修復測試
- 生成詳細報告

**適合場景**: 需要快速為專案添加測試

---

### 範例 4: 行銷情報多代理協作

**用途**: 輸入品牌/產品/目標，自動生成行銷定位與資料收集規劃

**運行方式**:
```bash
npm run marketing:intel -- --brief "品牌: X, 產品: Y, 目標: 提升銷售, 市場: 台灣"
```

**你會看到**:
- 行銷定位建議
- 有效資料與來源清單
- 合規與 robots 策略
- Pipeline 指令建議

---

## 🕷️ MarketSense 本機批次（Crawler/Analyzer）

### 環境準備

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r python/marketsense/requirements.txt
playwright install
```

### 設定環境變數

建立 `python/marketsense/.env`（可由 `.env.example` 複製）：

```bash
cp python/marketsense/.env.example python/marketsense/.env
```

### 執行抓取與分析

```bash
PYTHONPATH=python python -m marketsense.main_crawler --env-file python/marketsense/.env --urls-file urls.txt
PYTHONPATH=python python -m marketsense.main_analyzer --env-file python/marketsense/.env --limit 10
```

### LLM Brief（互動/自動）與 url.txt

```bash
PYTHONPATH=python python -m marketsense.main_brief --env-file python/marketsense/.env --brand "OPS" --product "Oyster Pink Studio 香氛皂" --objective "提升分享" --mode interactive
PYTHONPATH=python python -m marketsense.main_url_planner --env-file python/marketsense/.env --report-file brief_report.json --output url.txt --json-output url_report.json --auto-search
```

### Firestore 任務佇列

```bash
PYTHONPATH=python python -m marketsense.main_enqueue --env-file python/marketsense/.env --urls-file urls.txt
PYTHONPATH=python python -m marketsense.main_crawler --env-file python/marketsense/.env --from-firestore --limit 50 --lease-seconds 600
```

### 一鍵批次流程

```bash
PYTHONPATH=python python -m marketsense.run_pipeline --env-file python/marketsense/.env --urls-file urls.txt --use-firestore --limit-pending 50 --limit-analyze 50 --lease-seconds 600 --quality-review --brand "Apple" --product "iPhone 17" --objective "提升轉換"
```

### 品質回測與第二級優化

```bash
PYTHONPATH=python python -m marketsense.main_quality_review --env-file python/marketsense/.env --limit 50 --brand "Apple" --product "iPhone" --objective "提升轉換"
```

### 維護任務（回收鎖/重新排程）

```bash
PYTHONPATH=python python -m marketsense.main_maintenance --env-file python/marketsense/.env --reclaim-running --requeue-error-hours 24 --limit 200
```

### 報表與儀表板

```bash
PYTHONPATH=python python -m marketsense.main_report --env-file python/marketsense/.env --limit 200 --output-json report.json --output-csv report.csv
PYTHONPATH=python python -m marketsense.main_dashboard --env-file python/marketsense/.env --limit 200
```

### 安全上限測試（Probe）

```bash
PYTHONPATH=python python -m marketsense.probe_crawler --env-file python/marketsense/.env --urls-file urls.txt --levels 1,2,3,4 --stop-block-rate 0.05
```

## 🎨 自定義你的第一個代理

創建 `my-first-agent.ts`:

```typescript
import { CopilotClient } from "@github/copilot-sdk";

async function main() {
    // 1. 創建客戶端
    const client = new CopilotClient();
    await client.start();

    // 2. 創建你的自定義代理
    const session = await client.createSession({
        customAgents: [{
            name: "my-helper",
            displayName: "我的助手",
            prompt: "你是一位友善的助手,幫助用戶解決問題。",
            tools: ["view", "search"]
        }],
        model: "gpt-4.1"
    });

    // 3. 監聽回應
    session.on((event) => {
        if (event.type === "assistant.message") {
            console.log("助手:", event.data.content);
        } else if (event.type === "session.idle") {
            console.log("會話結束");
            cleanup();
        }
    });

    // 4. 發送訊息
    await session.send({ 
        prompt: "你好!請介紹一下你自己。" 
    });

    // 5. 清理資源
    async function cleanup() {
        await session.destroy();
        await client.stop();
    }
}

main().catch(console.error);
```

運行:
```bash
npx tsx my-first-agent.ts
```

## 🔧 常見問題快速解決

### 問題 1: `Cannot find module '@github/copilot-sdk'`

**解決方案**:
```bash
npm install @github/copilot-sdk
```

### 問題 2: `copilot: command not found`

**解決方案**:
安裝 GitHub Copilot CLI:
```bash
# 訪問官方安裝指南
open https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli
```

### 問題 3: 代理沒有回應

**解決方案**:
檢查事件監聽器:
```typescript
session.on((event) => {
    console.log("收到事件:", event.type);
    console.log("事件內容:", event.data);
});
```

### 問題 4: 執行速度慢

**解決方案**:
調整並行數量:
```typescript
const config = {
    maxParallelTasks: 3,  // 從 5 降到 3
    taskTimeout: 600000   // 增加超時時間
};
```

## 📖 下一步學習

### 基礎學習路徑

1. ✅ 運行基本範例 (你現在在這裡)
2. 📚 閱讀 [Copilot SDK 使用指南](./copilot-sdk-guide.md)
3. 🤖 了解 [代理系統架構](./agents.md)
4. 🛠️ 查看 [Skills 定義](./skills.json)
5. 💡 創建你的第一個自定義代理

### 進階學習路徑

1. 🔧 自定義工具開發
2. 🌐 整合 MCP 伺服器
3. 🎯 優化代理提示詞
4. 📊 實現進度監控
5. 🚀 部署到生產環境

## 💡 實用技巧

### 技巧 1: 查看詳細日誌

在範例中添加:
```typescript
session.on((event) => {
    console.log(JSON.stringify(event, null, 2));
});
```

### 技巧 2: 保存執行結果

```typescript
import * as fs from 'fs/promises';

const results = [...];
await fs.writeFile(
    'execution-results.json', 
    JSON.stringify(results, null, 2)
);
```

### 技巧 3: 自定義代理提示詞

```typescript
const enhancedPrompt = `
你是一位 ${role} 專家,專精於:
${skills.map(s => `- ${s}`).join('\n')}

工作原則:
${principles.map(p => `${p}`).join('\n')}

請確保:
${requirements.map(r => `✓ ${r}`).join('\n')}
`;
```

## 🎓 學習資源

### 官方文檔
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [Getting Started Guide](https://github.com/github/copilot-sdk/tree/main/docs/getting-started.md)
- [API Reference](https://github.com/github/copilot-sdk/tree/main/nodejs/README.md)

### 社群資源
- [Awesome Copilot](https://github.com/github/awesome-copilot)
- [Cookbook 範例](https://github.com/github/copilot-sdk/tree/main/cookbook)

## 🆘 需要幫助?

1. 查看 [完整文檔](./README.md)
2. 閱讀 [故障排除指南](./README.md#故障排除)
3. 參考 [範例代碼](./examples/)
4. 提交 [GitHub Issue](../../issues)

---

**祝你使用愉快! 🚀**

有問題隨時查看文檔或提交 Issue!
