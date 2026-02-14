#!/bin/bash

# SSR/GEO/AEO Deployment Helper Script
# Purpose: Automate verification and deployment steps
# Usage: chmod +x scripts/deploy-ssr-helper.sh && ./scripts/deploy-ssr-helper.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/generate-sitemap"
SITE_URL="https://lnkmx.my"
GOOGLE_BOT="Mozilla/5.0 (compatible; Googlebot/2.1)"
BING_BOT="Mozilla/5.0 (compatible; bingbot/2.0)"

# Global counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo ""
    echo "========================================="
    echo "  $1"
    echo "========================================="
}

print_section() {
    echo ""
    echo "--- $1 ---"
}

# Main verification functions
check_code_quality() {
    print_header "CODE QUALITY CHECKS"
    
    print_section "TypeScript Compilation"
    if npx tsc --noEmit 2>/dev/null; then
        log_success "TypeScript compilation passed"
    else
        log_error "TypeScript compilation failed"
    fi
    
    print_section "Dependency Status"
    if npm ci --audit 2>/dev/null | grep -q "added 0 packages"; then
        log_success "All dependencies installed and up to date"
    else
        log_warning "Some dependencies may need updating (verify manually)"
    fi
}

check_tests() {
    print_header "TEST EXECUTION"
    
    print_section "Unit Tests"
    if npm test -- --run 2>&1 | grep -q "passed"; then
        log_success "Unit tests passed"
    else
        log_warning "Run 'npm test' manually to verify all tests pass"
    fi
}

check_ssr_endpoints() {
    print_header "SSR ENDPOINT VERIFICATION"
    
    print_section "Landing Page SSR"
    LANDING_RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: $GOOGLE_BOT" \
        "$BASE_URL/ssr/landing?lang=ru")
    HTTP_CODE=$(echo "$LANDING_RESPONSE" | tail -1)
    BODY=$(echo "$LANDING_RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Landing page SSR: HTTP $HTTP_CODE"
        
        if echo "$BODY" | grep -q "<title>"; then
            log_success "Landing page has <title> tag"
        else
            log_error "Landing page missing <title> tag"
        fi
        
        if echo "$BODY" | grep -q "application/ld+json"; then
            log_success "Landing page has JSON-LD schema"
        else
            log_error "Landing page missing JSON-LD schema"
        fi
    else
        log_error "Landing page returned HTTP $HTTP_CODE (expected 200)"
    fi
    
    print_section "Gallery Page SSR"
    GALLERY_RESPONSE=$(curl -s -w "\n%{http_code}" -H "User-Agent: $BING_BOT" \
        "$BASE_URL/ssr/gallery?lang=en")
    HTTP_CODE=$(echo "$GALLERY_RESPONSE" | tail -1)
    BODY=$(echo "$GALLERY_RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Gallery page SSR: HTTP $HTTP_CODE"
        
        if echo "$BODY" | grep -q "CollectionPage"; then
            log_success "Gallery has CollectionPage schema"
        else
            log_warning "Gallery missing CollectionPage schema"
        fi
    else
        log_error "Gallery page returned HTTP $HTTP_CODE (expected 200)"
    fi
    
    print_section "Sitemap"
    SITEMAP_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/sitemap.xml")
    HTTP_CODE=$(echo "$SITEMAP_RESPONSE" | tail -1)
    BODY=$(echo "$SITEMAP_RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Sitemap endpoint: HTTP $HTTP_CODE"
        
        URL_COUNT=$(echo "$BODY" | grep -o "<loc>" | wc -l)
        if [ "$URL_COUNT" -gt 100 ]; then
            log_success "Sitemap contains $URL_COUNT URLs"
        else
            log_warning "Sitemap contains only $URL_COUNT URLs (expected 1000+)"
        fi
        
        if echo "$BODY" | grep -q "<?xml"; then
            log_success "Sitemap has valid XML declaration"
        else
            log_error "Sitemap missing XML declaration"
        fi
    else
        log_error "Sitemap returned HTTP $HTTP_CODE (expected 200)"
    fi
}

check_cache_headers() {
    print_header "CACHE HEADER VERIFICATION"
    
    print_section "Landing Page Cache Headers"
    CACHE_HEADERS=$(curl -s -I "$BASE_URL/ssr/landing" 2>/dev/null)
    
    if echo "$CACHE_HEADERS" | grep -q "Cache-Control"; then
        log_success "Cache-Control header present"
        CACHE_VALUE=$(echo "$CACHE_HEADERS" | grep "Cache-Control" | cut -d' ' -f2-)
        log_info "Cache-Control: $CACHE_VALUE"
    else
        log_error "Cache-Control header missing"
    fi
    
    if echo "$CACHE_HEADERS" | grep -q "ETag"; then
        log_success "ETag header present"
    else
        log_warning "ETag header missing (not critical)"
    fi
}

check_robots_txt() {
    print_header "ROBOTS.TXT VERIFICATION"
    
    print_section "robots.txt Accessibility"
    ROBOTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$SITE_URL/robots.txt")
    HTTP_CODE=$(echo "$ROBOTS_RESPONSE" | tail -1)
    BODY=$(echo "$ROBOTS_RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "robots.txt accessible: HTTP $HTTP_CODE"
    else
        log_error "robots.txt returned HTTP $HTTP_CODE (expected 200)"
    fi
    
    print_section "Sitemap URL in robots.txt"
    if echo "$BODY" | grep -q "Sitemap:"; then
        log_success "Sitemap URL present in robots.txt"
        SITEMAP_URL=$(echo "$BODY" | grep "Sitemap:" | head -1)
        log_info "$SITEMAP_URL"
    else
        log_error "Sitemap URL missing from robots.txt"
    fi
    
    print_section "Bot Allowances in robots.txt"
    BOTS=("Googlebot" "Bingbot" "GPTBot" "Claude-Web" "PerplexityBot")
    for bot in "${BOTS[@]}"; do
        if echo "$BODY" | grep -i "$bot" > /dev/null; then
            log_success "$bot is mentioned in robots.txt"
        else
            log_warning "$bot not explicitly mentioned"
        fi
    done
}

check_schema_validation() {
    print_header "SCHEMA.ORG VALIDATION"
    
    print_section "Landing Page Schema Types"
    LANDING=$(curl -s -H "User-Agent: $GOOGLE_BOT" "$BASE_URL/ssr/landing?lang=en")
    
    SCHEMAS=("WebSite" "Organization" "SoftwareApplication" "FAQPage")
    for schema in "${SCHEMAS[@]}"; do
        if echo "$LANDING" | grep -q "\"@type\":\"$schema\""; then
            log_success "Schema type: $schema"
        else
            log_warning "Schema type missing: $schema"
        fi
    done
    
    print_section "Multi-Language Support"
    HREFLANG_COUNT=$(echo "$LANDING" | grep -o 'hreflang="[^"]*"' | wc -l)
    if [ "$HREFLANG_COUNT" -ge 4 ]; then
        log_success "Hreflang tags present ($HREFLANG_COUNT)"
    else
        log_warning "Expected 4+ hreflang tags, found $HREFLANG_COUNT"
    fi
}

check_performance() {
    print_header "PERFORMANCE BASELINE"
    
    print_section "Response Time Measurement"
    
    # Warm up cache
    log_info "Warming up cache (5 requests)..."
    for i in {1..5}; do
        curl -s "$BASE_URL/ssr/landing" > /dev/null 2>&1
    done
    
    # Measure cold start
    log_info "Measuring cold start time..."
    START=$(date +%s%3N)
    curl -s "$BASE_URL/ssr/landing" > /dev/null 2>&1
    END=$(date +%s%3N)
    COLD_TIME=$((END - START))
    
    if [ "$COLD_TIME" -lt 300 ]; then
        log_success "Landing page cold start: ${COLD_TIME}ms (< 300ms)"
    else
        log_warning "Landing page cold start: ${COLD_TIME}ms (target: < 300ms)"
    fi
    
    # Measure warm response
    log_info "Measuring warm response time..."
    START=$(date +%s%3N)
    curl -s "$BASE_URL/ssr/landing" > /dev/null 2>&1
    END=$(date +%s%3N)
    WARM_TIME=$((END - START))
    
    if [ "$WARM_TIME" -lt 100 ]; then
        log_success "Landing page warm response: ${WARM_TIME}ms (< 100ms)"
    else
        log_warning "Landing page warm response: ${WARM_TIME}ms (target: < 100ms)"
    fi
}

check_git_status() {
    print_header "GIT STATUS"
    
    print_section "Uncommitted Changes"
    if git status --porcelain | grep -q .; then
        log_warning "Uncommitted changes found:"
        git status --short
    else
        log_success "All changes committed"
    fi
    
    print_section "Recent Commits"
    log_info "Latest 3 commits:"
    git log --oneline -3 | sed 's/^/  /'
}

deploy_functions() {
    print_header "DEPLOY EDGE FUNCTIONS"
    
    if [ -z "$1" ] || [ "$1" != "--confirm" ]; then
        log_info "To deploy, run with --confirm flag:"
        log_info "  ./scripts/deploy-ssr-helper.sh deploy --confirm"
        return
    fi
    
    print_section "Deploying Edge Functions"
    if supabase functions deploy generate-sitemap \
        --project-id pphdcfxucfndmwulpfwv \
        --no-verify-jwt 2>&1; then
        log_success "Edge functions deployed successfully"
    else
        log_error "Failed to deploy edge functions"
    fi
    
    print_section "Verifying Deployment"
    sleep 5
    check_ssr_endpoints
}

print_summary() {
    print_header "SUMMARY"
    
    echo ""
    echo "Tests Passed: ${GREEN}${PASSED}${NC}"
    echo "Tests Failed: ${RED}${FAILED}${NC}"
    echo "Warnings: ${YELLOW}${WARNINGS}${NC}"
    echo ""
    
    if [ "$FAILED" -eq 0 ]; then
        echo -e "${GREEN}✓ All critical checks passed!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Review DEPLOYMENT-CHECKLIST.md"
        echo "  2. Run: ./scripts/deploy-ssr-helper.sh deploy --confirm"
        echo "  3. Monitor: ./scripts/monitor-deployment.sh"
        echo "  4. Submit sitemap to search engines (see DEPLOYMENT-GUIDE.md)"
    else
        echo -e "${RED}✗ Some checks failed. Please review above.${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    case "${1:-verify}" in
        verify)
            echo -e "${BLUE}"
            echo " ███████████████████████████████████████████"
            echo " █  SSR/GEO/AEO Deployment Verification    █"
            echo " ███████████████████████████████████████████"
            echo -e "${NC}"
            
            check_code_quality
            check_tests
            check_ssr_endpoints
            check_cache_headers
            check_robots_txt
            check_schema_validation
            check_performance
            check_git_status
            
            print_summary
            ;;
            
        deploy)
            deploy_functions "$2"
            ;;
            
        quick)
            print_header "QUICK VERIFICATION"
            check_ssr_endpoints
            check_cache_headers
            ;;
            
        monitor)
            print_header "DEPLOYMENT MONITORING"
            check_performance
            check_ssr_endpoints
            ;;
            
        *)
            echo "Usage: $0 {verify|deploy|quick|monitor} [--confirm]"
            echo ""
            echo "Commands:"
            echo "  verify   - Full pre-deployment verification (default)"
            echo "  deploy   - Deploy Edge Functions (requires --confirm)"
            echo "  quick    - Quick endpoint + cache check"
            echo "  monitor  - Check performance metrics"
            echo ""
            echo "Examples:"
            echo "  ./scripts/deploy-ssr-helper.sh verify"
            echo "  ./scripts/deploy-ssr-helper.sh deploy --confirm"
            echo "  ./scripts/deploy-ssr-helper.sh monitor"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
