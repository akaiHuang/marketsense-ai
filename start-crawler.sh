#!/bin/bash
# MarketSense Crawler API 啟動腳本
# 一鍵啟動 crawler-api + ngrok

echo "🚀 啟動 MarketSense Crawler API..."

# 終止現有進程
echo "🔄 清理舊進程..."
pkill -f "node server.js" 2>/dev/null
pkill -f "ngrok" 2>/dev/null

# 等待進程結束
sleep 1

# 啟動 crawler-api (背景)
echo "📡 啟動 Crawler API (port 3002)..."
cd "$(dirname "$0")/crawler-api"
node server.js &
CRAWLER_PID=$!

# 等待 API 啟動
sleep 2

# 檢查 API 是否運行
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Crawler API 啟動成功！"
else
    echo "❌ Crawler API 啟動失敗"
    exit 1
fi

# 啟動 ngrok
echo "🌐 啟動 ngrok 隧道..."
ngrok http 3002 --log=stdout &
NGROK_PID=$!

# 等待 ngrok 啟動
sleep 3

# 獲取 ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "================================================"
echo "🎉 MarketSense Crawler API 已啟動！"
echo "================================================"
echo ""
echo "📍 本機 URL: http://localhost:3002"
echo "🌐 公網 URL: $NGROK_URL"
echo ""
echo "📱 前端網站: https://fir-js-61ce8.web.app"
echo "   請在設定中填入上面的公網 URL"
echo ""
echo "================================================"
echo "按 Ctrl+C 停止服務"
echo "================================================"

# 保持運行
wait
