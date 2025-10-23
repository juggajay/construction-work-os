#!/bin/bash

# Construction Work OS CLI Helper
# Quick commands for construction-work-os project

PROJECT_DIR="/mnt/c/Users/jayso/construction-work-os"

case "$1" in
  dev)
    cd "$PROJECT_DIR" && npm run dev
    ;;
  build)
    cd "$PROJECT_DIR" && npm run build
    ;;
  start)
    cd "$PROJECT_DIR" && npm run start
    ;;
  db:start)
    cd "$PROJECT_DIR" && npm run db:start
    ;;
  db:stop)
    cd "$PROJECT_DIR" && npm run db:stop
    ;;
  db:status)
    cd "$PROJECT_DIR" && npm run db:status
    ;;
  test)
    cd "$PROJECT_DIR" && npm run test
    ;;
  cd)
    cd "$PROJECT_DIR" && exec $SHELL
    ;;
  *)
    echo "Construction Work OS CLI Helper"
    echo ""
    echo "Usage: construction <command>"
    echo ""
    echo "Available commands:"
    echo "  dev          - Start development server"
    echo "  build        - Build the project"
    echo "  start        - Start production server"
    echo "  db:start     - Start local Supabase"
    echo "  db:stop      - Stop local Supabase"
    echo "  db:status    - Check database status"
    echo "  test         - Run tests"
    echo "  cd           - Navigate to project directory"
    echo ""
    echo "Example: construction dev"
    ;;
esac
