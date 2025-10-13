#!/bin/bash

# Post-create script for BPMN Studio development environment
set -e

echo "🚀 Setting up BPMN Studio development environment..."

# Ensure we're in the workspace directory
cd /workspace

# Set up git configuration if not already set
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Setting up git configuration..."
    git config --global user.name "Developer"
    git config --global user.email "developer@example.com"
    echo "   Note: Update git config with your actual name and email:"
    echo "   git config --global user.name 'Your Name'"
    echo "   git config --global user.email 'your.email@example.com'"
fi


# Verify starship is installed and working
echo "⭐ Verifying starship installation..."
if command -v starship >/dev/null 2>&1; then
    echo "   ✅ Starship is installed: $(starship --version)"
else
    echo "   ❌ Starship not found!"
fi

# Verify GitHub CLI is installed and working
echo "🐙 Verifying GitHub CLI installation..."
if command -v gh >/dev/null 2>&1; then
    echo "   ✅ GitHub CLI is installed: $(gh --version | head -n1)"
else
    echo "   ❌ GitHub CLI not found!"
fi

# Verify bashrc is properly set up
if [ -f "/home/node/.bashrc" ]; then
    echo "   ✅ Custom bashrc is in place"
else
    echo "   ❌ Custom bashrc not found!"
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
else
    echo "📦 Dependencies already installed, skipping..."
fi

echo ""
echo "✅ BPMN Studio environment setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "   pnpm dev              - Start development server"
echo "   pnpm build            - Build for production"
echo "   pnpm preview          - Preview production build"
echo "   pnpm test             - Run tests"
echo "   pnpm lint             - Run linting"
echo ""
echo "🐙 GitHub CLI commands:"
echo "   gh auth login         - Authenticate with GitHub"
echo "   gh repo create        - Create a new repository"
echo "   gh repo clone         - Clone a repository"
echo "   gh pr create          - Create a pull request"
echo "   gh pr list            - List pull requests"
echo "   gh issue list         - List issues"
echo ""
echo "🌐 Available services:"
echo "   http://localhost:5173  - Development server"
echo "   http://localhost:4173  - Preview server"
echo ""
echo "⭐ Starship prompt is ready - restart your terminal to see it in action!"
echo "🚀 To get started quickly, run: pnpm dev"
echo "" 