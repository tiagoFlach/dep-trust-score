#!/bin/bash

# Example: CI Pipeline Integration
# 
# This script demonstrates how to use dep-trust-score in a CI/CD pipeline
# to fail builds when dependency trust scores fall below a threshold.
#
# Usage:
#   ./ci-pipeline.sh package-name [threshold]
#   ./ci-pipeline.sh express 70
#   ./ci-pipeline.sh lodash react express 60

set -e

TRUST_SCORE_CMD="trust-score"
THRESHOLD=${2:-70}
PACKAGES=("$@")
FAILED_PACKAGES=()

# Remove threshold from packages array if it's the last argument
if [ ${#PACKAGES[@]} -gt 0 ]; then
    PACKAGES=("${PACKAGES[@]:0:${#PACKAGES[@]}-1}")
fi

echo "=================================="
echo "Dependency Trust Score CI Check"
echo "=================================="
echo "Threshold: $THRESHOLD"
echo "Packages: ${PACKAGES[@]}"
echo ""

# Function to check a single package
check_package() {
    local package=$1
    local threshold=$2
    
    echo "Checking $package..."
    
    # Get the trust score in JSON format
    local output
    if ! output=$($TRUST_SCORE_CMD check "$package" --output json 2>&1); then
        echo "  ❌ FAILED: Could not fetch data for $package"
        FAILED_PACKAGES+=("$package")
        return 1
    fi
    
    # Extract score from JSON
    local score=$(echo "$output" | grep -o '"score":[0-9.]*' | cut -d':' -f2)
    
    if [ -z "$score" ]; then
        echo "  ❌ FAILED: Could not parse score for $package"
        FAILED_PACKAGES+=("$package")
        return 1
    fi
    
    # Compare score with threshold
    local passes=$(echo "$score >= $threshold" | bc)
    
    if [ "$passes" = "1" ]; then
        echo "  ✓ PASSED: Score $score >= $threshold"
        return 0
    else
        echo "  ❌ FAILED: Score $score < $threshold"
        FAILED_PACKAGES+=("$package")
        return 1
    fi
}

# Check all packages
for package in "${PACKAGES[@]}"; do
    check_package "$package" "$THRESHOLD" || true
done

# Summary
echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo "Total packages checked: ${#PACKAGES[@]}"
echo "Failed packages: ${#FAILED_PACKAGES[@]}"

if [ ${#FAILED_PACKAGES[@]} -gt 0 ]; then
    echo ""
    echo "Failed packages:"
    for pkg in "${FAILED_PACKAGES[@]}"; do
        echo "  - $pkg"
    done
    echo ""
    echo "❌ Build FAILED: Some packages have low trust scores"
    exit 1
else
    echo ""
    echo "✓ Build PASSED: All packages meet the trust score threshold"
    exit 0
fi
