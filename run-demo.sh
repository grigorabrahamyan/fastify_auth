#!/bin/bash

echo "🚀 Starting Auth API Demo..."
echo ""

# Kill any existing processes on these ports
echo "🧹 Cleaning up any existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo ""
echo "🔧 Starting API server on port 3001..."
npx tsx src/server.ts &
API_PID=$!

sleep 3

echo "🌐 Starting demo server on port 8000..."
python3 -m http.server 8000 &
DEMO_PID=$!

sleep 2

echo ""
echo "✅ Demo is ready!"
echo ""
echo "🌍 Open in your browser: http://localhost:8000/demo.html"
echo "📡 API Server: http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/"
echo ""
echo "💡 The demo page will test Bearer tokens and expired token handling!"
echo ""
echo "⚡ Press Ctrl+C to stop"
echo ""

# Try to open browser on macOS
if command -v open >/dev/null 2>&1; then
    echo "🌐 Opening demo in browser..."
    open "http://localhost:8000/demo.html"
fi

# Wait for Ctrl+C
trap 'echo ""; echo "🛑 Stopping servers..."; kill $API_PID $DEMO_PID 2>/dev/null; echo "✅ Demo stopped!"; exit 0' INT

# Keep running
wait 