#!/bin/bash

# Link checker script for local development
# Usage: ./scripts/check-links.sh

set -e

echo "🔍 Checking documentation links..."

# Check if we're in the right directory
if [ ! -f "docs/_config.yml" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Build Jekyll site locally
echo "📝 Building Jekyll documentation..."
cd docs
bundle exec jekyll build --destination ../_site_test
cd ..

# Copy examples to test site
echo "📄 Copying examples..."
mkdir -p _site_test/examples
cp -r examples/* _site_test/examples/

# Check if htmlproofer is installed
if ! command -v htmlproofer &> /dev/null; then
    echo "📦 Installing html-proofer..."
    gem install html-proofer
fi

# Run link checker
echo "🔗 Checking links..."
htmlproofer _site_test \
    --disable-external \
    --check-html \
    --check-img-http \
    --allow-hash-href \
    --ignore-urls "/app/" \
    --ignore-files "/app/index.html" \
    --log-level :info

# Cleanup
echo "🧹 Cleaning up..."
rm -rf _site_test

echo "✅ All links are working correctly!"
echo ""
echo "💡 To check external links too, run:"
echo "   htmlproofer _site --check-external-hash --log-level :info"
