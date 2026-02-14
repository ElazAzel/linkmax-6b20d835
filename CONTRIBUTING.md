# Contributing to lnkmx

First off, thank you for considering contributing to lnkmx! It's people like you that make us the best platform for micro-businesses.

## 📜 Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all using our platform and contributing to our code. Please be respectful and considerate in all interactions.

## 🛠 Development Workflow

### 1. Branching Strategy
We use a simplified feature-branch workflow.
- **`main`**: The production-ready branch. Do not push directly here.
- **Feature Branches**: Create branches from `main` for new features or fixes.

**Naming Convention:**
- `feat/description`: New features (e.g., `feat/add-video-block`)
- `fix/description`: Bug fixes (e.g., `fix/auth-redirect`)
- `chore/description`: Maintenance, docs, configs (e.g., `chore/update-readme`)
- `refactor/description`: Code restructuring without behavior change

### 2. Commits
We follow the **Conventional Commits** specification.
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Example:**
```bash
git commit -m "feat: add instagram integration to social block"
```

### 3. Pull Requests
1. Push your branch to the repository.
2. Open a Pull Request against `main`.
3. Provide a clear title and description of your changes.
4. Link any relevant issues (e.g., `Closes #123`).
5. Wait for a code review from a team member.

## 📐 Coding Standards

### TypeScript & React
- **Strict Mode**: We use strict TypeScript. No `any` unless absolutely necessary.
- **Functional Components**: Use React Functional Components with Hooks.
- **Naming**:
    - Components: `PascalCase.tsx`
    - Hooks: `camelCase.ts` (prefix with `use`)
    - Utilities: `kebab-case.ts`
- **Imports**: Use absolute imports where possible (e.g., `@/components/ui/button` instead of `../../components/ui/button`).

### Styling
- We use **Tailwind CSS**.
- Avoid inline styles.
- Use `cn()` utility for conditional class merging.

### Linting & Formatting
Run these commands before committing to ensure your code meets our standards:

```bash
# Check for linting errors
npm run lint

# Check for type errors
npm run typecheck
```

## 🧪 Testing

We value stability. Please add tests for significant logic changes.

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run e2e
```

## 📝 Documentation
If you change a feature or API, please update the corresponding documentation in `docs/` and the logic in `README.md`.

---
Happy Coding! 🚀
