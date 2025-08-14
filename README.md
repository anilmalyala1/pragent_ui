
# PR Review Agent (Create React App)

Dark-mode UI prototype of a Pull Request Review Agent built with **Create React App**, **TailwindCSS**, and **lucide-react**.

## Scripts
```bash
npm install
npm start
npm run build
```

## Features
- 3‑pane layout: PR list • Diff viewer with inline AI flags • AI review panel
- Fix Preview modal with before/after diff
- Chat drawer for agent conversation
- Mock data + stubs to integrate your LangGraph backend

> Replace the mock calls in `PRReviewAgent.jsx` (`runAIReview`, `applyPatch`, chat handler) with your API routes.


## Mock API Server (Express)
This project includes a minimal Express server that simulates LangGraph endpoints:

- `POST /api/review/:id` → returns PR summary + mock issues
- `POST /api/patch` → accepts a patch and returns ok
- `POST /api/agent-chat` → returns a canned assistant reply

### Run both client and server
```bash
npm install
npm run dev   # runs Express server (4000) + CRA (3000) together
```
The CRA `proxy` is set to `http://localhost:4000`, so calls to `/api/*` are forwarded to the server.


## Data flow
The UI no longer uses hard-coded PRs or code. It loads from the server:

- `GET /api/prs` → PR list
- `GET /api/prs/:id/files` → files in PR
- `GET /api/file/:name` → file content
- `POST /api/review/:id` → issues + summary

Patches update server-side file content; re-opening file reflects changes.

## API host configuration
Each API group can point to a different host for progressive integration. Set any of the following environment variables when starting the dev server or building:

- `REACT_APP_API_HOST_PRS`
- `REACT_APP_API_HOST_REVIEW`
- `REACT_APP_API_HOST_PATCH`
- `REACT_APP_API_HOST_CHAT`

If a variable is not provided, requests fall back to the current origin.
