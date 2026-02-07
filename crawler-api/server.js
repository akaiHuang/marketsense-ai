require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS 設定 - 允許所有來源（生產環境請限制）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MiniMax API 設定
const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';
const MINIMAX_API_KEY = process.env.OLLAMA_API_KEY || '';

// ========== AI 分析 API ==========
app.post('/api/analyze', async (req, res) => {
  try {
    const { brandName, tagline, description, targetAudience, keywords, tone } = req.body;

    const prompt = `你是一位資深的社群數據分析師和行銷專家。請根據以下品牌資訊，分析目標受眾的痛點、情緒和行為模式。

## 品牌資訊
- 品牌名稱：${brandName}
- 核心標語：${tagline}
- 產品描述：${description || '未提供'}
- 目標受眾：${targetAudience || '一般大眾'}
- 搜尋關鍵字：${keywords.join('、')}
- 語調風格：${tone}

## 分析任務
請提供：
1. **受眾痛點**：5-7 個痛點，標注嚴重程度（高/中/低）
2. **情緒分佈**：主要情緒類型和佔比（總和100）
3. **熱門趨勢**：相關社群話題
4. **語言風格**：建議的溝通語調
5. **行銷建議**：4-6 條具體建議

請以 JSON 格式回覆：
{
  "painPoints": [{ "point": "描述", "severity": "高/中/低", "examples": ["例子"] }],
  "emotions": [{ "emotion": "類型", "percentage": 數字 }],
  "trends": ["趨勢1"],
  "languageStyle": ["建議1"],
  "recommendations": ["建議1"]
}
只輸出 JSON，不要其他文字。`;

    if (!MINIMAX_API_KEY) {
      return res.json({ analysis: getMockAnalysis() });
    }

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: '你是專業社群行銷分析師，用繁體中文回覆，只輸出 JSON。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      console.error('MiniMax API error');
      return res.json({ analysis: getMockAnalysis() });
    }

    const data = await response.json();
    let analysisText = data.choices?.[0]?.message?.content || '{}';
    
    // 清理 JSON
    analysisText = analysisText.trim();
    if (analysisText.startsWith('```json')) analysisText = analysisText.slice(7);
    if (analysisText.startsWith('```')) analysisText = analysisText.slice(3);
    if (analysisText.endsWith('```')) analysisText = analysisText.slice(0, -3);
    
    const analysis = JSON.parse(analysisText.trim());
    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.json({ analysis: getMockAnalysis() });
  }
});

// ========== AI 內容生成 API ==========
app.post('/api/generate', async (req, res) => {
  try {
    const { config, analysis } = req.body;
    const { brandName, tagline, tone, contentCount, keywords } = config;

    const prompt = `你是專業社群內容創作者。

## 品牌資訊
- 品牌：${brandName}
- 標語：${tagline}
- 語調：${tone}
- 關鍵字：${keywords.join('、')}

## 受眾洞察
- 痛點：${analysis.painPoints.map(p => p.point).join('、')}
- 情緒：${analysis.emotions.map(e => e.emotion).join('、')}

## 任務
生成 ${contentCount} 篇 IG 貼文，包含：
- 電量警示系列：${Math.ceil(contentCount * 0.3)} 篇
- 療癒充電站：${Math.ceil(contentCount * 0.3)} 篇  
- 允許休息系列：${Math.ceil(contentCount * 0.4)} 篇

每篇包含：標題、完整文案（含 emoji）、5-7 個 Hashtag、圖片建議

回覆格式：{"contents": [{
  "id": 1,
  "series": "系列名",
  "title": "標題",
  "content": "文案",
  "hashtags": ["#標籤"],
  "imagePrompt": "圖片建議"
}]}
只輸出 JSON。`;

    if (!MINIMAX_API_KEY) {
      return res.json({ contents: getMockContents(contentCount, brandName) });
    }

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: '你是頂尖社群創作專家，用繁體中文，只輸出 JSON。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      })
    });

    if (!response.ok) {
      return res.json({ contents: getMockContents(contentCount, brandName) });
    }

    const data = await response.json();
    let responseText = data.choices?.[0]?.message?.content || '{"contents":[]}';
    
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) responseText = responseText.slice(7);
    if (responseText.startsWith('```')) responseText = responseText.slice(3);
    if (responseText.endsWith('```')) responseText = responseText.slice(0, -3);
    
    const parsed = JSON.parse(responseText.trim());
    const contents = Array.isArray(parsed) ? parsed : (parsed.contents || []);
    
    res.json({ contents });
  } catch (error) {
    console.error('Generate error:', error);
    res.json({ contents: getMockContents(10, 'Brand') });
  }
});

// ========== Dcard 爬蟲 API ==========
app.post('/api/crawl/dcard', async (req, res) => {
  const { keyword, maxArticles = 20 } = req.body;
  
  let browser;
  try {
    console.log(`🔍 開始爬取 Dcard 關鍵字: ${keyword}`);
    
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // 搜尋頁面
    const searchUrl = `https://www.dcard.tw/search?query=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待載入
    await page.waitForTimeout(2000);
    
    // 滾動載入更多
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1000);
    }
    
    // 提取文章資訊
    const articles = await page.evaluate(() => {
      const items = document.querySelectorAll('article, [class*="PostEntry"], [class*="post"]');
      const results = [];
      
      items.forEach((item, index) => {
        if (index >= 20) return;
        
        const titleEl = item.querySelector('h2, h3, [class*="title"]');
        const excerptEl = item.querySelector('p, [class*="excerpt"], [class*="content"]');
        const statsEl = item.querySelector('[class*="like"], [class*="comment"]');
        
        if (titleEl) {
          results.push({
            title: titleEl.textContent?.trim() || '',
            excerpt: excerptEl?.textContent?.trim() || '',
            stats: statsEl?.textContent?.trim() || ''
          });
        }
      });
      
      return results;
    });
    
    // 取得搜尋結果數量
    const resultCount = await page.evaluate(() => {
      const countEl = document.querySelector('[class*="count"], [class*="result"]');
      return countEl?.textContent?.match(/\\d+/)?.[0] || '0';
    });
    
    await browser.close();
    
    console.log(`✅ 爬取完成: ${articles.length} 篇文章`);
    
    res.json({
      success: true,
      keyword,
      articleCount: parseInt(resultCount) || articles.length,
      articles: articles.slice(0, maxArticles)
    });
    
  } catch (error) {
    console.error('Crawl error:', error);
    if (browser) await browser.close();
    
    res.json({
      success: false,
      keyword,
      error: error.message,
      articles: []
    });
  }
});

// ========== 健康檢查 ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'MarketSense Crawler API',
    version: '1.0.0',
    endpoints: [
      'POST /api/analyze - AI 受眾分析',
      'POST /api/generate - AI 內容生成',
      'POST /api/crawl/dcard - Dcard 爬蟲',
      'GET /health - 健康檢查'
    ]
  });
});

// ========== Mock Data ==========
function getMockAnalysis() {
  return {
    painPoints: [
      { point: '工作壓力導致身心俱疲', severity: '高', examples: ['加班過勞', '職場焦慮'] },
      { point: '生活與工作難以平衡', severity: '高', examples: ['沒有私人時間', '總是在趕'] },
      { point: '對未來感到迷茫', severity: '中', examples: ['不知道方向', '缺乏目標'] },
      { point: '社交疲勞與孤獨感', severity: '中', examples: ['不想社交', '假裝沒事很累'] },
      { point: '休息時的罪惡感', severity: '中', examples: ['覺得在浪費時間', '無法放鬆'] },
    ],
    emotions: [
      { emotion: '疲憊', percentage: 35 },
      { emotion: '焦慮', percentage: 25 },
      { emotion: '渴望放鬆', percentage: 20 },
      { emotion: '無奈', percentage: 12 },
      { emotion: '期待改變', percentage: 8 },
    ],
    trends: ['躺平文化', '療癒系內容', '自我關懷', 'work-life balance'],
    languageStyle: [
      '使用溫暖同理的語氣',
      '避免說教式表達',
      '加入適度幽默',
      '多用 emoji 增加親切感',
    ],
    recommendations: [
      '主打「允許休息」的核心訴求',
      '用電量比喻建立品牌識別',
      '創造系列內容增加黏著度',
      '發文時間選在通勤和睡前',
    ],
  };
}

function getMockContents(count, brandName) {
  const mockPosts = [
    {
      series: '電量警示系列',
      title: '今天的電量：3%',
      content: `📱 手機電量 3% 的時候\n你會急著找充電器\n\n但你自己電量 3% 的時候\n卻還在硬撐\n\n今天允許自己\n先充飽電再說 🔋`,
      hashtags: [`#${brandName.replace(/\\s/g, '')}`, '#電量不足', '#允許自己休息', '#療癒'],
      imagePrompt: '手機電量 3% 畫面，搭配趴桌人物插畫，莫蘭迪綠色調',
    },
    {
      series: '療癒充電站',
      title: '五分鐘快速充電',
      content: `只有五分鐘也能充電：\n\n1️⃣ 閉眼深呼吸 10 次\n2️⃣ 伸展肩頸\n3️⃣ 喝杯溫水\n4️⃣ 看窗外發呆\n5️⃣ 摸摸貓（或看別人的）\n\n五分鐘也是充電 ⚡`,
      hashtags: [`#${brandName.replace(/\\s/g, '')}`, '#五分鐘充電', '#微休息', '#療癒時刻'],
      imagePrompt: '五個步驟插圖，輪播格式，柔和配色',
    },
    {
      series: '允許休息系列',
      title: '你已經很努力了',
      content: `你可能覺得自己還不夠努力\n但其實\n\n光是每天起床\n面對這個世界\n就已經很努力了\n\n你已經很棒了\n真的 💛`,
      hashtags: [`#${brandName.replace(/\\s/g, '')}`, '#你很棒', '#已經很努力了', '#自我肯定'],
      imagePrompt: '擁抱自己的溫暖插畫，黃色暖色調',
    },
  ];

  return mockPosts.slice(0, count).map((post, i) => ({ id: i + 1, ...post }));
}

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`
🚀 MarketSense Crawler API 啟動成功！
📍 Local: http://localhost:${PORT}
📚 API 文檔: http://localhost:${PORT}/

可用端點:
  POST /api/analyze    - AI 受眾分析
  POST /api/generate   - AI 內容生成
  POST /api/crawl/dcard - Dcard 爬蟲
  GET  /health         - 健康檢查
  `);
});
