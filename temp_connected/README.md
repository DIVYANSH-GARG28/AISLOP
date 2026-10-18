# ConnectEd - Hackathon Repository Skeleton

## Directory Structure

```text
ConnectEd/
├── src/
│   ├── ai/               # AI Team workspace
│   │   ├── services/     # AI service modules (roadmaps, skill gap analysis)
│   │   ├── matching/     # Alumni & mentor semantic matching logic
│   │   ├── rag/          # Vector search, embeddings, RAG assistant
│   │   ├── schemas/      # Zod schemas for structured LLM output
│   │   └── prompts/      # System & user prompt templates
│   ├── backend/          # Backend Team workspace
│   │   ├── controllers/  # API controllers
│   │   ├── routes/       # Express / Node API routes
│   │   ├── services/     # Business logic
│   │   ├── db/           # PostgreSQL + pgvector schema & connection
│   │   └── middleware/   # Authentication, validation, error handling
│   ├── frontend/         # Frontend Team workspace (React)
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page views
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client services
│   │   └── styles/       # CSS / styling files
│   └── shared/           # Shared types, constants, and utilities across teams
│       ├── types/        # Shared TypeScript definitions
│       └── utils/        # Shared helper functions
├── .env.example          # Environment variables template
└── README.md
```
# ConnectEd — Common Development Rules

You are working as one member of a 3-agent development team building **ConnectEd**, an AI-powered Alumni Career & Networking Platform for a 24-hour hackathon.

Three agents are working simultaneously:

* AI Agent
* Backend Agent
* Frontend Agent

This project is ALREADY IN PROGRESS.

You are NOT starting a new project.

## MOST IMPORTANT RULE

Complete ONLY the task given to you in the current task prompt.

Do NOT try to build the entire ConnectEd project.

Do NOT implement features that belong to another agent.

Do NOT modify unrelated code.

Before making changes:

1. Inspect the existing project.
2. Understand what has already been implemented.
3. Reuse existing code where possible.
4. Follow the existing architecture and conventions.

## Shared Technology

Frontend:

* React
* Vite
* Tailwind CSS

Backend:

* Node.js
* Express
* Prisma
* PostgreSQL
* pgvector

AI:

* LLM API
* Embeddings
* RAG
* AI tools/agent orchestration
* Zod for structured AI output

## Team Boundaries

AI Agent:

* AI logic, prompts, embeddings, matching, RAG, agents and AI services.

Backend Agent:

* APIs, database, Prisma, PostgreSQL, authentication, data and backend integration.

Frontend Agent:

* React pages, components, UI, API integration and user experience.

Do not take over another agent's responsibility.

## Shared Project Rules

1. Never delete working functionality without a specific reason.
2. Never rewrite the project unnecessarily.
3. Never introduce a new framework or major dependency without approval.
4. Never hardcode API keys, passwords or secrets.
5. Use environment variables for secrets.
6. Do not commit `.env` files.
7. Keep code simple and hackathon-friendly.
8. Reuse existing utilities, components, types and services.
9. Follow existing naming and folder conventions.
10. Do not create duplicate implementations.
11. Do not modify unrelated files.
12. Keep changes focused on the assigned task.
13. Validate inputs and outputs appropriately.
14. Do not invent real-world alumni information.
15. AI-generated recommendations must be explainable.
16. Do not create fake AI confidence scores.
17. Keep the application demo-ready and reliable.
18. Run relevant tests, type-checks or builds after making changes.
19. If something is already implemented, use or improve it instead of rebuilding it.
20. If another part of the project is required but missing, clearly report it instead of implementing unrelated functionality.

## Existing Project Awareness

Always assume that:

* Other agents may have changed the project.
* Your code will be integrated with their work.
* Your changes must not break their work.
* The repository is the single source of truth.

Do not assume files are empty or that you need to recreate them.

## Task Discipline

For every task:

1. Inspect.
2. Plan briefly.
3. Implement ONLY the requested task.
4. Test the change.
5. Check that unrelated functionality was not broken.
6. Report the result.

## Final Report

After completing the task, provide:

* What you changed
* Files changed
* What was tested
* Any issues/blockers
* Anything another agent needs to know

Remember:

**ConnectEd is an ongoing shared project.**

**Do only the assigned task.**

**Do not build beyond the scope of the current task.**
