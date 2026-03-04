# Contributing Guide

## Development Workflow

### Prerequisites
- Node.js 20+
- npm 10+
- Firebase account
- Vercel account (for deployment)

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pojistna-pomoc.git
   cd pojistna-pomoc
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Fill in your Firebase, Stripe, and other credentials
   ```

5. Run development server:
   ```bash
   npm run dev
   ```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes
3. Test your changes:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

4. Commit your changes:
   ```bash
   git commit -m '( Add my feature'
   ```

5. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```

6. Open a Pull Request

## Commit Convention

We use emoji-based commit messages for better readability:

- ( `feat:` New feature
- = `fix:` Bug fix
- =Ý `docs:` Documentation changes
- =„ `style:` Code styling (formatting, white-space)
- { `refactor:` Code refactoring
- ¡ `perf:` Performance improvements
-  `test:` Adding or updating tests
- =' `chore:` Build process or tooling changes
- =€ `deploy:` Deployment-related changes
- = `security:` Security fixes

### Example:
```bash
git commit -m "( Add Google login to authentication flow"
```

## Code Style

- Use TypeScript (strict mode)
- Follow ESLint configuration
- Use Prettier for formatting
- Component names: PascalCase
- File names: kebab-case
- Use functional components with hooks

## Testing

Before submitting a PR, ensure:
-  Code builds without errors
-  ESLint passes
-  TypeScript type-checks pass
-  All features work in development mode

## Pull Request Process

1. Update README.md if needed
2. Update documentation for new features
3. Ensure all checks pass
4. Request review from maintainers
5. Wait for approval before merging

## Questions?

Contact: radim@wikiporadce.cz
