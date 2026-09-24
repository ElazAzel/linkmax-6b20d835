#!/bin/bash
# SSR Quick Test Script
# Tests all three SSR endpoints locally

set -e

BASE_URL="https://hpnycvncipdxmvqfuulf.supabase.co/functions/v1/generate-sitemap"
GOOGLEBOT_UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🤖 SSR Testing Suite${NC}\n"

# Test 1: Landing Page
echo -e "${YELLOW}[1/5] Testing Landing Page SSR...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: $GOOGLEBOT_UA" "$BASE_URL/ssr/landing?lang=ru")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ $HTTP_CODE == "200" ]]; then
  if echo "$BODY" | grep -q "<title>.*lnkmx.*Micro-Business OS"; then
    echo -e "${GREEN}✓ Landing page returns 200 with correct title${NC}"
  else
    echo -e "${RED}✗ Landing page missing title${NC}"
  fi
  
  if echo "$BODY" | grep -q "<meta name=\"description\""; then
    echo -e "${GREEN}✓ Meta description found${NC}"
  else
    echo -e "${RED}✗ Meta description missing${NC}"
  fi
  
  if echo "$BODY" | grep -q "\"@type\": \"WebSite\""; then
    echo -e "${GREEN}✓ Schema.org JSON-LD found${NC}"
  else
    echo -e "${RED}✗ Schema.org JSON-LD missing${NC}"
  fi
  
  if echo "$BODY" | grep -q "og:title"; then
    echo -e "${GREEN}✓ Open Graph tags found${NC}"
  else
    echo -e "${RED}✗ Open Graph tags missing${NC}"
  fi
else
  echo -e "${RED}✗ Landing page returned HTTP $HTTP_CODE${NC}"
fi

echo ""

# Test 2: Gallery Page
echo -e "${YELLOW}[2/5] Testing Gallery Page SSR...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: $GOOGLEBOT_UA" "$BASE_URL/ssr/gallery?lang=en")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ $HTTP_CODE == "200" ]]; then
  if echo "$BODY" | grep -q "Gallery"; then
    echo -e "${GREEN}✓ Gallery page returns 200${NC}"
  fi
  
  if echo "$BODY" | grep -q "\"@type\": \"CollectionPage\""; then
    echo -e "${GREEN}✓ CollectionPage schema found${NC}"
  else
    echo -e "${RED}✗ CollectionPage schema missing${NC}"
  fi
  
  if echo "$BODY" | grep -q "ItemList"; then
    echo -e "${GREEN}✓ ItemList found${NC}"
  else
    echo -e "${RED}✗ ItemList missing${NC}"
  fi
else
  echo -e "${RED}✗ Gallery page returned HTTP $HTTP_CODE${NC}"
fi

echo ""

# Test 3: Sitemap
echo -e "${YELLOW}[3/5] Testing Sitemap Generation...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ $HTTP_CODE == "200" ]]; then
  if echo "$BODY" | grep -q "<?xml"; then
    echo -e "${GREEN}✓ Sitemap returns valid XML${NC}"
  else
    echo -e "${RED}✗ Sitemap XML invalid${NC}"
  fi
  
  if echo "$BODY" | grep -q "<loc>https://lnkmx.my/</loc>"; then
    echo -e "${GREEN}✓ Landing page in sitemap${NC}"
  fi
  
  if echo "$BODY" | grep -q "<loc>https://lnkmx.my/gallery</loc>"; then
    echo -e "${GREEN}✓ Gallery in sitemap${NC}"
  fi
  
  # Count user pages
  COUNT=$(echo "$BODY" | grep -c "loc>https://lnkmx.my/[a-z" || true)
  if [[ $COUNT -gt 0 ]]; then
    echo -e "${GREEN}✓ Found ~$COUNT user pages in sitemap${NC}"
  fi
else
  echo -e "${RED}✗ Sitemap returned HTTP $HTTP_CODE${NC}"
fi

echo ""

# Test 4: robots.txt
echo -e "${YELLOW}[4/5] Testing robots.txt...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "https://lnkmx.my/robots.txt")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [[ $HTTP_CODE == "200" ]]; then
  if echo "$BODY" | grep -q "Sitemap:"; then
    echo -e "${GREEN}✓ Sitemap URL declared in robots.txt${NC}"
  else
    echo -e "${RED}✗ Sitemap URL missing${NC}"
  fi
  
  if echo "$BODY" | grep -q "Disallow: /admin"; then
    echo -e "${GREEN}✓ Admin path disallowed${NC}"
  fi
  
  if echo "$BODY" | grep -q "Disallow: /dashboard"; then
    echo -e "${GREEN}✓ Dashboard path disallowed${NC}"
  fi
else
  echo -e "${RED}✗ robots.txt returned HTTP $HTTP_CODE${NC}"
fi

echo ""

# Test 5: Cache Headers
echo -e "${YELLOW}[5/5] Testing Cache Headers...${NC}"
HEADERS=$(curl -s -I -H "User-Agent: $GOOGLEBOT_UA" "$BASE_URL/ssr/landing")

if echo "$HEADERS" | grep -q "Cache-Control.*s-maxage"; then
  echo -e "${GREEN}✓ s-maxage cache header found${NC}"
else
  echo -e "${RED}✗ Cache headers may be missing${NC}"
fi

if echo "$HEADERS" | grep -q "X-Robots-Tag: index"; then
  echo -e "${GREEN}✓ X-Robots-Tag allows indexing${NC}"
else
  echo -e "${YELLOW}⚠ X-Robots-Tag may need adjustment${NC}"
fi

echo ""
echo -e "${GREEN}✅ SSR Test Suite Complete!${NC}\n"

echo "Next steps:"
echo "1. Visit https://search.google.com/test/rich-results"
echo "2. Paste https://lnkmx.my/ to validate structured data"
echo "3. Submit sitemap to Google Search Console"
echo "4. Monitor coverage in GSC for indexing status"
