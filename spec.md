# GitHub AI Explorer

## Current State
The app is a full-featured GitHub Explorer with:
- GitHub repo search, trending, bookmarks, repo details
- Star history, activity heatmap, issue tracker, PR pulse, CI/CD viewer tabs per repo
- AI setup assistant (generates setup scripts, Termux commands, Dockerfile/docker-compose.yml stubs)
- Web terminal with AI assistant, file browser, session manager, local bridge
- Profile home, settings, Internet Identity auth
- GitHub PAT storage and fork support

Docker support is limited to generating basic Dockerfile/docker-compose.yml text in the AISetupAssistant component. There is no dedicated Docker page, no in-app editing of Docker files, and no Docker-specific terminal integration.

## Requested Changes (Diff)

### Add
- `DockerPage` (`/repo/:owner/:name/docker`) — dedicated Docker section for a repo
  - View and edit generated `Dockerfile` and `docker-compose.yml` in an in-app code editor (textarea-based with syntax highlight styling)
  - Docker image layer/size analysis (heuristic, based on base image and detected tech stack)
  - Generate tailored `docker-compose.yml` based on detected languages/frameworks
  - Buttons to copy, download, or commit files back to forked repo via GitHub API
- Docker terminal integration on the TerminalPage
  - Pre-built Docker command shortcuts in the command palette (build, run, compose up/down, ps, logs, exec)
  - AI suggestions aware of Docker context when in the Docker section
- Add "Docker" tab to RepoNavTabs in RepoDetailsPage

### Modify
- `RepoDetailsPage` / `RepoNavTabs` — add Docker tab linking to `/repo/:owner/:name/docker`
- `App.tsx` — add route for DockerPage
- `TerminalPage` / `CommandPalette` — add Docker command shortcuts

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/services/dockerGenerator.ts` — utilities to generate Dockerfile and docker-compose.yml based on tech stack, and heuristic layer analysis
2. Create `src/frontend/src/pages/DockerPage.tsx` — full Docker section: file editor tabs (Dockerfile / docker-compose.yml), layer analysis panel, copy/download/commit actions
3. Update `RepoDetailsPage.tsx` — add Docker tab to RepoNavTabs
4. Update `App.tsx` — register `/repo/$owner/$name/docker` route
5. Update `CommandPalette.tsx` — add Docker command shortcuts
