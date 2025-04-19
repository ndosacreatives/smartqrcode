# Add the modified files
git add netlify.toml
git add next.config.js
git add package.json
# Removed the next.config.ts file
git rm --cached next.config.ts

# Commit the changes
git commit -m "Fix Netlify deployment configuration:
- Updated netlify.toml to use 'out' directory
- Added export configuration to next.config.js
- Updated netlify-build script to use next export
- Removed duplicate next.config.ts file"

# Push the changes (if you want to)
# git push 