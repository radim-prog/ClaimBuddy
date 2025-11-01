# Git History Cleanup - Removing Exposed Secrets

⚠️ **WARNING:** Tyto operace přepíší git history. Koordinuj s týmem!

## Metoda 1: BFG Repo-Cleaner (Doporučeno)

### Install BFG
```bash
brew install bfg
```

### Vytvořit secrets.txt
```
AIzaSyBqBcc2Wc9-dTv1bFLBIpMJUVCG-B_ZfP4
```

### Clean repository
```bash
# Backup
cp -r /Users/Radim/Projects/claimbuddy /Users/Radim/Projects/claimbuddy-backup

cd /Users/Radim/Projects/claimbuddy

# Remove sensitive data from all commits
bfg --replace-text secrets.txt

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ koordinuj s týmem!)
git push --force --all
```

## Metoda 2: git filter-branch

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

git push --force --all
```

## Po cleanup:

1. ✅ Všichni členové týmu musí:
   ```bash
   git fetch --all
   git reset --hard origin/main
   ```

2. ✅ Kontaktovat GitHub support pro cache purge:
   https://support.github.com/contact

3. ✅ Ověřit že secrets nejsou v history:
   ```bash
   git log --all --full-history --source --pretty=format: | \
     grep -i "AIzaSyBqBcc2Wc9-dTv1bFLBIpMJUVCG-B_ZfP4"
   ```
   Mělo by vrátit NIČÍM.

## Prevence

Setup GitHub Secret Scanning:
- Repository → Settings → Security → Secret Scanning
- Enable "Push protection"
