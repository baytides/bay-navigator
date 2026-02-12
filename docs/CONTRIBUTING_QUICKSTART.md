# Contributing to Bay Navigator

Thank you for your interest in contributing to Bay Navigator! This guide will help you get started.

## Development Setup

### Prerequisites

**Web App:**

- Node.js 22.x LTS
- npm 10+
- Git

See [README Runtime Matrix](../README.md#runtime-matrix) for the canonical versions.

**Flutter App (optional):**

- Flutter 3.x
- Dart 3.x
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/baytides/baynavigator.git
cd baynavigator

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`.

### Flutter App Setup

```bash
cd apps
flutter pub get
flutter run
```

## Project Structure

```
baynavigator/
├── src/
│   ├── components/     # Reusable Astro components
│   ├── data/          # YAML program data files
│   ├── layouts/       # Page layouts
│   ├── pages/         # Route pages
│   └── styles/        # Global styles
├── public/            # Static assets
├── scripts/           # Build and data sync scripts
├── azure-functions/   # Serverless API functions
├── apps/              # Flutter cross-platform app (iOS, Android, macOS, Windows, Linux)
└── tests/             # Test files
```

## Available Scripts

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `npm run dev`           | Start development server  |
| `npm run build`         | Build for production      |
| `npm run preview`       | Preview production build  |
| `npm run lint`          | Run ESLint                |
| `npm run lint:fix`      | Fix ESLint errors         |
| `npm run format`        | Format code with Prettier |
| `npm run format:check`  | Check formatting          |
| `npm run test:unit`     | Run unit tests            |
| `npm run test:a11y`     | Run accessibility tests   |
| `npm run validate:data` | Validate YAML data files  |

## Code Style

- We use ESLint and Prettier for code formatting
- Pre-commit hooks automatically format staged files
- Follow existing patterns in the codebase

### Commit Messages

We follow conventional commit format:

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(directory): add filter by county`
- `fix(search): handle empty query`
- `docs(readme): update installation steps`

## Adding Program Data

Program data lives in `src/data/*.yml`. Each program should include:

```yaml
- name: Program Name
  description: Brief description
  category: Category name
  eligibility: Who is eligible
  how_to_apply: Application instructions
  link: https://example.com
  agency: Providing agency
```

After adding data, run `npm run build` to regenerate the API.

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Accessibility Tests

```bash
npm run test:a11y
```

We maintain WCAG 2.2 AAA compliance. All new components must pass accessibility tests.

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:unit && npm run test:a11y`)
5. Run linting (`npm run lint`)
6. Commit your changes
7. Push to your fork
8. Open a Pull Request

### PR Guidelines

- Fill out the PR template completely
- Link any related issues
- Include screenshots for UI changes
- Ensure all checks pass

## Reporting Issues

When reporting bugs, please include:

- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Code of Conduct

Be respectful and inclusive. We're building tools to help underserved communities access public services.

## Questions?

Open a GitHub Discussion or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
