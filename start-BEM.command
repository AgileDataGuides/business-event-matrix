#!/bin/bash
cd "$(dirname "$0")/app"
npm install
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Business Event Matrix — local-only"
echo "  Listening on http://127.0.0.1:5121"
echo "  Do NOT expose this port to a LAN or the internet."
echo "════════════════════════════════════════════════════════════"
echo ""
npm run dev -- --port 5121
