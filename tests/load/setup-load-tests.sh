#!/bin/bash

###############################################################################
# Load Testing Setup Script
# Automatically installs dependencies and configures environment
#
# Usage: ./tests/load/setup-load-tests.sh
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║          🔧 Load Testing Suite - Setup                          ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Step 1: Check OS
echo -e "${CYAN}📋 Detecting operating system...${NC}"
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macos"
  echo -e "${GREEN}✅ macOS detected${NC}\n"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  OS="linux"
  echo -e "${GREEN}✅ Linux detected${NC}\n"
else
  echo -e "${YELLOW}⚠️  Unknown OS: $OSTYPE${NC}"
  echo -e "${YELLOW}   You may need to install dependencies manually${NC}\n"
fi

# Step 2: Install k6
echo -e "${CYAN}📦 Installing k6...${NC}"

if command -v k6 &> /dev/null; then
  echo -e "${GREEN}✅ k6 already installed: $(k6 version | head -n1)${NC}\n"
else
  if [ "$OS" == "macos" ]; then
    if command -v brew &> /dev/null; then
      echo "   Installing k6 via Homebrew..."
      brew install k6
      echo -e "${GREEN}✅ k6 installed successfully${NC}\n"
    else
      echo -e "${YELLOW}⚠️  Homebrew not found. Install manually:${NC}"
      echo "   https://k6.io/docs/getting-started/installation/"
    fi
  elif [ "$OS" == "linux" ]; then
    echo "   Installing k6 via apt..."
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update
    sudo apt-get install k6
    echo -e "${GREEN}✅ k6 installed successfully${NC}\n"
  fi
fi

# Step 3: Install Artillery
echo -e "${CYAN}📦 Installing Artillery...${NC}"

if command -v artillery &> /dev/null; then
  echo -e "${GREEN}✅ Artillery already installed: $(artillery version)${NC}\n"
else
  if command -v npm &> /dev/null; then
    echo "   Installing Artillery via npm..."
    npm install -g artillery
    echo -e "${GREEN}✅ Artillery installed successfully${NC}\n"
  else
    echo -e "${RED}❌ npm not found. Install Node.js first:${NC}"
    echo "   https://nodejs.org/"
    exit 1
  fi
fi

# Step 4: Install Playwright
echo -e "${CYAN}📦 Installing Playwright...${NC}"

if [ -f "$PROJECT_ROOT/node_modules/.bin/playwright" ]; then
  echo -e "${GREEN}✅ Playwright already installed${NC}\n"
else
  echo "   Installing Playwright..."
  npm install -D @playwright/test
  npx playwright install chromium
  echo -e "${GREEN}✅ Playwright installed successfully${NC}\n"
fi

# Step 5: Create .env.load-test
echo -e "${CYAN}📝 Setting up environment configuration...${NC}"

if [ -f "$PROJECT_ROOT/.env.load-test" ]; then
  echo -e "${YELLOW}⚠️  .env.load-test already exists. Skipping...${NC}\n"
else
  cp "$PROJECT_ROOT/.env.load-test.example" "$PROJECT_ROOT/.env.load-test"
  echo -e "${GREEN}✅ Created .env.load-test from example${NC}"
  echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env.load-test with your test credentials!${NC}\n"
fi

# Step 6: Create results directory
echo -e "${CYAN}📁 Creating results directory...${NC}"

mkdir -p "$PROJECT_ROOT/tests/load/results"
echo -e "${GREEN}✅ Results directory created${NC}\n"

# Step 7: Add to .gitignore
echo -e "${CYAN}📝 Updating .gitignore...${NC}"

if grep -q "tests/load/results" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
  echo -e "${GREEN}✅ .gitignore already configured${NC}\n"
else
  echo "" >> "$PROJECT_ROOT/.gitignore"
  echo "# Load testing" >> "$PROJECT_ROOT/.gitignore"
  echo "tests/load/results/" >> "$PROJECT_ROOT/.gitignore"
  echo ".env.load-test" >> "$PROJECT_ROOT/.gitignore"
  echo -e "${GREEN}✅ Updated .gitignore${NC}\n"
fi

# Step 8: Make scripts executable
echo -e "${CYAN}🔧 Making scripts executable...${NC}"

chmod +x "$PROJECT_ROOT/tests/load/run-all-load-tests.sh"
chmod +x "$PROJECT_ROOT/tests/load/setup-load-tests.sh"
echo -e "${GREEN}✅ Scripts are now executable${NC}\n"

# Step 9: Verify setup
echo -e "${CYAN}✅ Verifying installation...${NC}\n"

SETUP_COMPLETE=true

if command -v k6 &> /dev/null; then
  echo -e "${GREEN}✅ k6: $(k6 version | head -n1)${NC}"
else
  echo -e "${RED}❌ k6 not installed${NC}"
  SETUP_COMPLETE=false
fi

if command -v artillery &> /dev/null; then
  echo -e "${GREEN}✅ Artillery: $(artillery version)${NC}"
else
  echo -e "${RED}❌ Artillery not installed${NC}"
  SETUP_COMPLETE=false
fi

if [ -f "$PROJECT_ROOT/node_modules/.bin/playwright" ]; then
  echo -e "${GREEN}✅ Playwright: Installed${NC}"
else
  echo -e "${RED}❌ Playwright not installed${NC}"
  SETUP_COMPLETE=false
fi

echo ""

# Final summary
if [ "$SETUP_COMPLETE" = true ]; then
  echo -e "${GREEN}"
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║                                                                  ║"
  echo "║          ✅ Setup Complete!                                      ║"
  echo "║                                                                  ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}\n"

  echo -e "${CYAN}📋 Next Steps:${NC}"
  echo ""
  echo "1. Edit your test credentials:"
  echo "   ${YELLOW}nano .env.load-test${NC}"
  echo ""
  echo "2. Create test data in your database (staging/local):"
  echo "   - 100+ projects"
  echo "   - 50+ RFIs, Submittals, Change Orders"
  echo ""
  echo "3. Run the load tests:"
  echo "   ${YELLOW}./tests/load/run-all-load-tests.sh${NC}"
  echo ""
  echo -e "${GREEN}🚀 You're ready to battle test your app!${NC}\n"
else
  echo -e "${RED}"
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║                                                                  ║"
  echo "║          ❌ Setup Incomplete                                     ║"
  echo "║                                                                  ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}\n"

  echo -e "${YELLOW}Some dependencies failed to install.${NC}"
  echo -e "${YELLOW}Please install them manually and run this script again.${NC}\n"
  exit 1
fi
