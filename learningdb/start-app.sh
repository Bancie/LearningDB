#!/bin/bash

# LearningDB Startup Script
PROJECT_DIR="/Users/chibangnguyen/ayai/LearningDB/learningdb"

# Start Backend in new Terminal tab
osascript -e "tell application \"Terminal\"
    activate
    do script \"cd $PROJECT_DIR/backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload\"
end tell"

# Wait a moment for backend to initialize
sleep 2

# Start Frontend in new Terminal tab
osascript -e "tell application \"Terminal\"
    do script \"cd $PROJECT_DIR && npm run dev\"
end tell"

# Open browser after servers start
sleep 3
open "http://localhost:5173"
