#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Authentication API Demo${NC}\n"

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up processes...${NC}"
    
    # Kill background processes
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null
        echo -e "${GREEN}✅ API server stopped${NC}"
    fi
    
    if [ ! -z "$DEMO_PID" ]; then
        kill $DEMO_PID 2>/dev/null
        echo -e "${GREEN}✅ Demo server stopped${NC}"
    fi
    
    echo -e "${BLUE}👋 Demo stopped. Thanks for testing!${NC}"
    exit 0
}

# Setup trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the backend directory.${NC}"
    exit 1
fi

if [ ! -f "demo.html" ]; then
    echo -e "${RED}❌ Error: demo.html not found. Please make sure the demo file exists.${NC}"
    exit 1
fi

# Start the API server
echo -e "${YELLOW}🔧 Starting API server...${NC}"
npx tsx src/server.ts &
API_PID=$!

# Wait a moment for the API server to start
sleep 3

# Check if API server is running
if kill -0 $API_PID 2>/dev/null; then
    echo -e "${GREEN}✅ API server started successfully (PID: $API_PID)${NC}"
    echo -e "${BLUE}📡 API running at: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Failed to start API server${NC}"
    exit 1
fi

# Start the demo HTML server
echo -e "${YELLOW}🌐 Starting demo HTML server...${NC}"
python3 -m http.server 8000 > /dev/null 2>&1 &
DEMO_PID=$!

# Wait a moment for the demo server to start
sleep 2

# Check if demo server is running
if kill -0 $DEMO_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Demo server started successfully (PID: $DEMO_PID)${NC}"
    echo -e "${BLUE}🌍 Demo running at: http://localhost:8000/demo.html${NC}"
else
    echo -e "${RED}❌ Failed to start demo server${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Both servers are running!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📱 API Server:${NC}  http://localhost:3001"
echo -e "${GREEN}🌐 Demo Page:${NC}  http://localhost:8000/demo.html"
echo -e "${GREEN}📚 API Docs:${NC}   http://localhost:3001/"
echo -e "${GREEN}🏥 Health:${NC}     http://localhost:3001/health"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}📋 Instructions:${NC}"
echo -e "1. Open ${BLUE}http://localhost:8000/demo.html${NC} in your browser"
echo -e "2. Use the demo page to test authentication features"
echo -e "3. Register/Login and test Bearer token functionality"
echo -e "4. Try the 'Test Expired Token' feature"
echo -e "5. Check the activity log for real-time API calls"
echo -e "\n${YELLOW}💡 Tip:${NC} The demo page will automatically handle token refresh!"

# Try to open the demo in the default browser (macOS)
if command -v open >/dev/null 2>&1; then
    echo -e "\n${BLUE}🌐 Opening demo page in your default browser...${NC}"
    sleep 1
    open "http://localhost:8000/demo.html"
fi

echo -e "\n${YELLOW}⚡ Press Ctrl+C to stop both servers${NC}\n"

# Keep the script running and show live logs
echo -e "${BLUE}📊 Live Server Status:${NC}"
while true; do
    # Check if both processes are still running
    if ! kill -0 $API_PID 2>/dev/null; then
        echo -e "${RED}❌ API server stopped unexpectedly${NC}"
        break
    fi
    
    if ! kill -0 $DEMO_PID 2>/dev/null; then
        echo -e "${RED}❌ Demo server stopped unexpectedly${NC}"
        break
    fi
    
    # Show status every 30 seconds
    echo -e "${GREEN}✅ $(date '+%H:%M:%S') - Both servers running${NC}"
    sleep 30
done

# If we get here, something went wrong
cleanup 