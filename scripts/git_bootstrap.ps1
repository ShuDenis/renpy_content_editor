Param(
  [string]$Remote = ""
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "git not found"
  exit 1
}

if (-not (Test-Path ".git")) {
  git init | Out-Null
}

$branch = (& git rev-parse --abbrev-ref HEAD) 2>$null
if ($LASTEXITCODE -ne 0 -or $branch -eq "") {
  git checkout -b develop
} else {
  git checkout -B develop
}

git add .
git commit -m "chore(init): scaffold browser content editor" -m "Initial structure:`n- React+TS app via Vite`n- Scenes & Dialogs editors (MVP)`n- Zod types + JSON Schemas`n- Docs (tech spec, milestones, contributing)`n- Samples`n- Git bootstrap scripts"

if ($Remote -ne "") {
  if ((git remote) -contains "origin") {
    git remote set-url origin $Remote
  } else {
    git remote add origin $Remote
  }
  git push -u origin develop
}

Write-Host "Repository initialized on 'develop'."
