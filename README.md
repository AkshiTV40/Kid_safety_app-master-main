# Kid Safety — Guardian Portal

Public repository for the Kid Safety Guardian Portal (Next.js + PWA).
Ring in your pocket

Getting started

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
npm run start:prod
```

Deployment

- Recommended hosting: **Vercel** (Next.js native). You can also use **Firebase Hosting**. See `DEPLOYMENT.md` for details.

Contributing

- Please open issues and pull requests on GitHub.

Recording improvements and uploads
---------------------------------
- A **Recordings** page (`/recordings`) now lists saved recordings, shows thumbnails, duration, and supports Download, Upload, and Delete actions (stored client-side in IndexedDB).
- Server-side upload endpoint: `POST /api/recordings/upload` accepts a multipart `file` field and saves to `public/uploads/` in development. Consider a cloud storage workflow for production.
- Tests: Unit tests using Vitest have been added for recordings storage and a small media compatibility util. Run `npm install` then `npm test` to execute.

Pushing to GitHub
-----------------
- If you want me to create a GitHub repo and push the current branch automatically, run `scripts/create_repo.sh <org-or-user> [repo-name]` (or `scripts/create_repo.ps1` on Windows). The script uses `gh` (GitHub CLI) if available and will push to a `recordings-improvements` branch.
- If you prefer manual steps, run:
  - `git init`
  - `git checkout -b recordings-improvements`
  - `git add . && git commit -m "feat: recordings viewer, upload endpoint, tests"`
  - Create a GitHub repo on the web and `git remote add origin <url>` then `git push -u origin recordings-improvements`.

License

- MIT — see `LICENSE` file.
