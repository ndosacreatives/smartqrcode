@echo off
echo Setting up Node.js environment...

set PATH=%PATH%;C:\Program Files\nodejs
set PATH=%PATH%;%APPDATA%\npm
set NODE_ENV=development

echo Running npm install...
call npm install

echo Starting development server...
call npm run dev

pause 