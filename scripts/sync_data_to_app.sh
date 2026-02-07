#!/bin/bash
# Copies data/ JSON files into app/data/ so the Next.js build can access them.
# Run after collect.py / analyze.py / generate_sample_analysis.py.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$PROJECT_DIR/app/data"
cp "$PROJECT_DIR/data/"*.json "$PROJECT_DIR/app/data/"

echo "Synced data/ → app/data/"
ls -lh "$PROJECT_DIR/app/data/"
