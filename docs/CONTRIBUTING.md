# Contributing to SkillBridge

Thank you for your interest in contributing to **SkillBridge**! We welcome contributions from developers, designers, educators, and technical recruiters who want to build a better, fairer, skill-first hiring ecosystem.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Branching Conventions](#branching-conventions)
- [Commit Message Standards](#commit-message-standards)
- [Coding & Design Guidelines](#coding--design-guidelines)
  - [Backend (Python / FastAPI)](#backend-python--fastapi)
  - [Frontend (HTML / CSS / JavaScript)](#frontend-html--css--javascript)
- [Pull Request Checklist](#pull-request-checklist)

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful, constructive, and supportive in all discussions, pull requests, and issue threads.

---

## How to Contribute

1. **Fork the Repository**: Create a personal fork of the repository on GitHub.
2. **Clone Locally**:
   ```bash
   git clone https://github.com/<your-username>/Curiousparc_Trinity-Coders.git
   cd Curiousparc_Trinity-Coders
   ```
3. **Create a Feature Branch**: Always create a dedicated branch for your change (never commit directly to `main`).
4. **Develop & Test**: Implement your changes and ensure all existing unit tests pass.
5. **Submit a Pull Request**: Push your branch to GitHub and open a Pull Request against the `main` branch.

---

## Branching Conventions

Follow semantic prefixing when naming branches:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feature/` | New functionality or features | `feature/ai-resume-parser` |
| `bugfix/` | Fixing a reported bug or flaw | `bugfix/matching-zero-division` |
| `docs/` | Documentation improvements | `docs/update-api-specs` |
| `refactor/` | Code refactoring without behavior change | `refactor/api-client-service` |
| `test/` | Adding or fixing test suites | `test/add-profile-unit-tests` |

---

## Commit Message Standards

We enforce [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional longer body explaining context and rationale]
```

### Supported Types:
- `feat`: A new feature (e.g., `feat(matcher): add quiz score weighting to algorithm`)
- `fix`: A bug fix (e.g., `fix(auth): resolve google oauth token extraction on mobile`)
- `docs`: Documentation updates (e.g., `docs(api): document new job application endpoints`)
- `style`: Formatting, missing semicolons, etc. (no code logic change)
- `refactor`: Refactoring code without altering external API behavior
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks, dependency bumps, or config adjustments

---

## Coding & Design Guidelines

### Backend (Python / FastAPI)
- Adhere strictly to **PEP 8** style guidelines.
- Always use explicit Python type annotations (`typing.List`, `typing.Optional`, `uuid.UUID`).
- Use Pydantic models for request bodies and response models.
- Maintain test coverage for any modifications to the matching algorithm (`backend/tests/`).
- Do not commit sensitive keys or `.env` files.

### Frontend (HTML / CSS / JavaScript)
- Use standard, modern JavaScript (ES6+), avoiding external heavy bundle dependencies where possible.
- Maintain CSS variables defined in `assets/css/main.css` for consistent typography, spacing, and color palettes.
- Ensure semantic HTML5 elements are used for accessibility (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- Provide responsive design handling down to mobile screens (min-width: 320px).

---

## Pull Request Checklist

Before submitting your PR, verify:

- [ ] Code follows repository style and architecture conventions.
- [ ] No extraneous console logs, debugging statements, or secrets are committed.
- [ ] All tests pass via `pytest backend/tests/`.
- [ ] Documentation has been updated to reflect any API or schema changes.
- [ ] PR title follows conventional commit formatting.
- [ ] PR description outlines the problem solved, changes made, and steps to test.
