Param(
  [string]$Owner = '',
  [string]$RepoName = 'kid-safety-guardian'
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git not found. Install git and retry."
  exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Warning "gh (GitHub CLI) not found. Please install and run 'gh auth login' or create repo manually."
}

if (-not (Test-Path .git)) {
  git init
}

git checkout -b recordings-improvements -q 2>$null || git checkout recordings-improvements -q

git add .
git commit -m "feat: recordings viewer, upload endpoint, tests"

if (Get-Command gh -ErrorAction SilentlyContinue) {
  if ($Owner) {
    gh repo create "$Owner/$RepoName" --public --source=. --remote=origin --push
  } else {
    gh repo create "$RepoName" --public --source=. --remote=origin --push
  }
  Write-Host "Repository created and pushed via gh."
} else {
  Write-Host "No GH CLI detected. Create a repo via GitHub and run: git remote add origin <git-url>; git push -u origin recordings-improvements"
}
