# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-04-28

### Added
- Initial release of dep-trust-score
- Core trust score calculation with 8 factors:
  - Publication frequency
  - Package age
  - Number of maintainers
  - Version history
  - Known vulnerabilities
  - Dependency complexity
  - Abandonment signals
  - Package quality
- Programmatic API for single and batch package analysis
- CLI with commands: check, batch, explain, cache, config
- Local cache system with TTL support
- Offline mode for air-gapped environments
- Custom weight configuration for different contexts
- Full TypeScript support with type definitions
- Comprehensive test coverage (unit and integration)
- GitHub Actions workflow example
- CI/CD integration examples for Jenkins, GitLab, Azure Pipelines
- Detailed documentation and guides
- Multiple output formats (JSON, text, table)
- Detailed score breakdowns with explanations

### Features
- **Transparent Scoring**: Every score backed by explainable factors
- **Security-First**: Detects vulnerabilities and tracks abandonment
- **Fast & Cached**: Reduces API calls with local caching
- **Flexible Configuration**: Adjust weights for different contexts
- **Multiple Outputs**: JSON for automation, text for humans
- **Batch Analysis**: Efficiently analyze multiple packages
- **Programmatic API**: Full Node.js/TypeScript support
- **CLI Tool**: Quick terminal access and CI/CD integration

### Documentation
- Comprehensive README with quick start guide
- API Reference documentation
- Configuration guide with context-specific examples
- CI/CD Integration guide with examples for major platforms
- Architecture documentation
- Multiple example scripts and use cases

### Testing
- Unit tests for ScoreCalculator
- Unit tests for LocalCache
- Integration tests for TrustScoreAPI
- Test coverage configuration

---

## Future Roadmap

### [1.1.0] - Planned
- [ ] GitHub security advisories integration
- [ ] npm audit API integration
- [ ] Historical trend tracking
- [ ] More detailed vulnerability information
- [ ] Configurable cache TTL

### [2.0.0] - Planned
- [ ] Web dashboard UI
- [ ] SBOM (Software Bill of Materials) support
- [ ] Custom registry support
- [ ] Webhook notifications for score changes
- [ ] Enterprise features (authentication, audit logs)

---

## Support Policy

- **Active Development**: 1.x releases
- **Security Updates**: 1.x releases
- **Bug Fixes**: 1.x releases

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
