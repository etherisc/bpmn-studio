# GitHub Pages Setup Documentation

## Overview

The Process Editor is deployed to GitHub Pages using a custom GitHub Actions workflow that builds both the application and Jekyll documentation.

## Architecture

### Branch Strategy

- **`docs` branch**: Source for GitHub Pages deployment
- **`develop` branch**: Active development
- **`main` branch**: Stable releases

### Deployment Pipeline

```
docs branch push → GitHub Actions → Build App + Docs → Deploy to Pages
```

## GitHub Actions Workflow

### File: `.github/workflows/deploy.yml`

The workflow performs these steps:

1. **Checkout code** from `docs` branch
2. **Setup Node.js** and pnpm
3. **Install dependencies** (`pnpm install`)
4. **Build Process Editor** (`pnpm run build`)
5. **Setup Ruby** and Jekyll dependencies
6. **Build Jekyll documentation**
7. **Combine app and docs** in `_site/` directory
8. **Deploy to GitHub Pages**

### Key Configuration

```yaml
# Trigger on docs branch only
on:
  push:
    branches: [ docs ]

# Required permissions
permissions:
  contents: read
  pages: write
  id-token: write

# Build environment
- node-version: '20'
- ruby-version: '3.1'
- pnpm-version: '9'
```

## Site Structure

### Deployed URLs

- **Documentation**: `https://etherisc.github.io/bpmn-studio/`
- **Live App**: `https://etherisc.github.io/bpmn-studio/app/`

### Directory Mapping

```
GitHub Pages Root:
├── /                     # Jekyll docs (from docs/)
├── /app/                 # Process Editor (from dist/)
├── /guides/              # User guides
├── /api/                 # API documentation
└── /assets/              # Static assets
```

## Configuration Files

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/bpmn-studio/app/' : '/',
  publicDir: 'assets'
});
```

**Key Settings**:
- **Base path**: `/bpmn-studio/app/` for GitHub Pages
- **Public directory**: `assets/` for templates and styles
- **Build output**: `dist/` directory

### Jekyll Configuration

```yaml
# docs/_config.yml
baseurl: "/bpmn-studio"
url: "https://etherisc.github.io"
theme: just-the-docs
```

**Key Settings**:
- **Base URL**: `/bpmn-studio` for GitHub Pages
- **Theme**: Just the Docs for professional appearance
- **Excludes**: Internal docs, build files, dependencies

## Troubleshooting

### Common Issues

**404 Errors on App**:
- Check Vite base path configuration
- Verify assets are copied correctly
- Check GitHub Pages settings

**Jekyll Build Failures**:
- Verify Gemfile dependencies
- Check for invalid front matter
- Ensure vendor/ directory is excluded

**Asset Loading Issues**:
- Check relative vs absolute paths
- Verify publicDir configuration
- Test with production build locally

### Debug Steps

1. **Check GitHub Actions logs**:
   ```bash
   gh run list
   gh run view <run-id> --log
   ```

2. **Test locally**:
   ```bash
   # Test app build
   NODE_ENV=production pnpm run build
   
   # Test Jekyll build
   cd docs
   bundle exec jekyll serve
   ```

3. **Verify deployment**:
   - Check GitHub Pages settings
   - Verify branch is set to `docs`
   - Check custom domain settings (if any)

## Maintenance

### Regular Tasks

- **Update dependencies**: Monthly security updates
- **Monitor build times**: Optimize if builds become slow
- **Check broken links**: Verify all documentation links work
- **Review analytics**: Monitor usage patterns (if enabled)

### Dependency Updates

```bash
# Update Node.js dependencies
pnpm update

# Update Jekyll dependencies
cd docs
bundle update
```

## Security Considerations

### GitHub Actions

- **Permissions**: Minimal required permissions only
- **Secrets**: No secrets required for public deployment
- **Dependencies**: Regular security updates

### Asset Security

- **No sensitive data**: All assets are public
- **HTTPS only**: GitHub Pages enforces HTTPS
- **Content Security**: No user-generated content

## Performance Optimization

### Build Optimization

- **Code splitting**: Consider for large bundles
- **Asset optimization**: Images, fonts, etc.
- **Caching**: Leverage GitHub Pages CDN

### Jekyll Optimization

- **Exclude unnecessary files**: Keep build fast
- **Optimize images**: Compress assets
- **Minimize plugins**: Only essential Jekyll plugins

## Monitoring

### Available Metrics

- **GitHub Pages**: Basic traffic analytics
- **GitHub Actions**: Build success/failure rates
- **Repository**: Stars, forks, issues

### Health Checks

- **Automated**: GitHub Actions build status
- **Manual**: Periodic functionality testing
- **User feedback**: GitHub issues and discussions


