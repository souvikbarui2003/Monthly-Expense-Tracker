# Contributing to FinTrack AI

Thank you for your interest in contributing to FinTrack AI!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `bun install`
4. Set up Convex: `bunx convex dev`
5. Create a branch: `git checkout -b feature/your-feature`

## Development Setup

### Prerequisites
- Node.js 18+
- Bun package manager
- Convex account (free tier works)

### Running Locally

```bash
# Install dependencies
bun install

# Start Convex (in a separate terminal)
bunx convex dev

# Start the dev server (in another terminal)
bun run dev
```

### ML Pipeline Setup (Optional)

```bash
cd ml
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Generate dataset
python data/generate_dataset.py

# Train models
python training/train_classifier.py
python training/train_forecaster.py
python training/train_budget_model.py
python training/train_anomaly_model.py
```

## Code Guidelines

### TypeScript/React
- Use TypeScript strict mode
- Prefer functional components with hooks
- Import hooks from `react` only
- Use Tailwind CSS for styling
- Follow existing code patterns in the project

### Convex Backend
- Every mutation must verify user ownership
- Use `v.id("users")` for user identity
- Add proper indexes for query performance
- Handle errors with descriptive messages

### Security
- Never commit secrets or API keys
- Validate all user input
- Use `sanitizeCSVCell()` for CSV exports
- No hardcoded credentials

## Pull Request Process

1. Ensure `bun tsc -b --noEmit` passes
2. Ensure `bun run build` succeeds
3. Test your changes manually
4. Write a clear PR description
5. Reference any related issues

## Commit Messages

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `refactor: improve code structure`
- `test: add tests`

## Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
