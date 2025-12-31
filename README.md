# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible web applications.  
This MVP focuses on demonstrating an interactive piano and sound-sequence generation powered by Tone.js.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

---

## Project Description

10x Astro Starter is a boilerplate that combines Astro 5, React 19 and TypeScript 5 with Tailwind CSS 4 and shadcn/ui components.  
The primary MVP feature showcased here is an **interactive piano** capable of **generating and playing sound sequences** via Tone.js. This repository acts as a learning playground as well as a kick-off template for more advanced apps.

## Tech Stack

| Layer                | Technology                                      |
| -------------------- | ----------------------------------------------- |
| Web framework        | Astro 5                                         |
| Client UI            | React 19                                        |
| Language             | TypeScript 5                                    |
| Styling              | Tailwind CSS 4                                  |
| UI primitives        | shadcn/ui (Radix UI + class-variance-authority) |
| Audio engine         | Tone.js 15                                      |
| Backend-as-a-Service | Supabase                                        |

## Getting Started Locally

### Prerequisites

- Node.js **v22.14.0** (see `.nvmrc`)
- npm (bundled with Node)

```bash
# 1. Clone the repo
git clone https://github.com/your-org/10x-astro-starter.git
cd 10x-astro-starter

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Optional commands:

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Available Scripts

| Script             | Description                                     |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Launches the development server with hot reload |
| `npm run build`    | Generates an optimized production bundle        |
| `npm run preview`  | Serves the production build for testing         |
| `npm run astro`    | Exposes the Astro CLI                           |
| `npm run lint`     | Runs ESLint across the codebase                 |
| `npm run lint:fix` | Attempts to automatically fix ESLint issues     |
| `npm run format`   | Formats files with Prettier                     |
| `npm run supabase` | Executes the Supabase CLI (if installed)        |

## Project Scope

The repository demonstrates two core capabilities:

1. **Interactive Piano Component** – A clickable/keyboard-driven piano rendered in React.
2. **Sound-Sequence Generation** – Simple note patterns produced and played via Tone.js.

All other advanced features (multi-user auth, payments, analytics, etc.) are purposefully excluded from this Proof of Concept.

## Project Status

![status-badge](https://img.shields.io/badge/status-in_progress-yellow.svg)

The project is in active development. Feedback and contributions are welcome!

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
