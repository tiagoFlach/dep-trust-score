# Contributing to dep-trust-score

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to the Contributor Covenant code of conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

When reporting bugs, please include:
- A clear title and description
- Steps to reproduce
- Expected vs. actual behavior
- Your environment (OS, Node version, npm version)
- Relevant error messages or logs

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an issue:
- Use a clear, descriptive title
- Provide a detailed description
- List examples demonstrating the expected behavior
- Explain why this enhancement would be useful

### Pull Requests

1. **Fork and clone** the repository
2. **Create a branch** for your feature/fix: `git checkout -b feature/your-feature`
3. **Make your changes** with clear, descriptive commits
4. **Add tests** for new functionality
5. **Run tests** to ensure everything passes: `npm test`
6. **Run linter**: `npm run lint`
7. **Format code**: `npm run format`
8. **Create a Pull Request** with a clear description

#### PR Guidelines

- Keep PRs focused on a single feature or fix
- Reference relevant issues
- Update documentation if needed
- Add tests for new functionality
- Ensure all tests pass

## Development Setup

### Prerequisites
- Node.js 16 or later
- npm 7 or later

### Setup Instructions

```bash
# Clone the repository
git clone https://github.com/tiagoFlach/dep-trust-score.git
cd dep-trust-score

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
dep-trust-score/
├── src/
│   ├── core/           # Core types and interfaces
│   ├── collectors/     # Data collection from npm
│   ├── calculators/    # Score calculation logic
│   ├── cache/          # Cache management
│   ├── cli/            # CLI implementation
│   └── index.ts        # Main API export
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── examples/           # Usage examples
├── docs/               # Documentation
└── README.md          # Main documentation
```

## Code Standards

### TypeScript

- Use strict mode
- Avoid `any` type
- Document public APIs with JSDoc comments
- Use meaningful variable and function names

### Testing

- Write tests for new features
- Aim for >80% code coverage
- Use descriptive test names
- Test both success and error cases

### Commits

- Write clear, descriptive commit messages
- Use imperative mood ("add feature" not "added feature")
- Keep commits focused and atomic
- Reference issues when relevant

Example:
```
docs: add configuration guide

- Explain weight system
- Add context-specific examples
- Fix typos in API reference

Fixes #123
```

## Documentation

When contributing code:
- Update relevant documentation
- Add/update JSDoc comments for public APIs
- Include examples if appropriate
- Update the README if adding major features

## Testing Guidelines

### Unit Tests

```typescript
describe('Feature', () => {
  it('should do X when Y', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = function(input);
    
    // Assert
    expect(result).toBe(...);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test -- ScoreCalculator.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Debugging

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Logging

Use console for debugging:
```typescript
console.debug('Value:', value);
console.error('Error:', error);
```

## Performance Considerations

- Cache results to reduce API calls
- Batch operations when possible
- Avoid unnecessary network requests
- Consider memory usage for large datasets

## Security

- Don't commit secrets or API keys
- Validate all inputs
- Follow security best practices
- Report security issues privately

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Publish: `npm publish`

## Questions?

- Open an issue for discussions
- Check existing documentation
- Review examples in the `examples/` directory

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make dep-trust-score better! 🎉
