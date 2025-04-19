@echo off
git add netlify.toml
git add next.config.js
git add package.json
git rm --cached next.config.ts
git commit -m "Fix Netlify deployment configuration"
echo "Changes committed successfully. Run 'git push' to push to remote repository." 