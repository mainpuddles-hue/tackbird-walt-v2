# Git Workflow

## Branch Model

Single `main` branch. All work committed directly to main.

```
main ← all commits land here
```

## Commit Convention

Prefix commits with type:

| Prefix | When |
|--------|------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `security:` | Security hardening |
| `docs:` | Documentation changes |
| `refactor:` | Code restructure without behavior change |

Examples from history:
```
feat: client-side image optimization before upload
feat: avatar cleanup, notification pagination, booking email, neighborhood settings
security: CIS-yhteensopivat tietoturvaheaderit
security: rate limiting kaikille API-reiteille (CIS brute force -suojaus)
fix: 20 bugia korjattu auditoinnin perusteella
```

## Workflow

1. Make changes
2. `npm run build` — verify no build errors
3. `git add <specific files>`
4. `git commit -m "feat: description"`
5. `git push` — always push after commit

## CI/CD

Deployed to Vercel. Every push to `main` triggers a production deployment.

```
git push → Vercel build → Production
```

## Repository

- **Remote:** `https://github.com/mainpuddles-hue/tackbird-v2` (private)
- **gh CLI:** `~/.local/bin/gh`
