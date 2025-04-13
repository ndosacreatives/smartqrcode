@echo off
echo Checking Node.js and npm installation...

set PATH=%PATH%;C:\Program Files\nodejs
set PATH=%PATH%;%APPDATA%\npm

echo Node.js version:
node -v

echo npm version:
npm -v

echo Environment setup complete. You can now run dev.bat to start the development server.
pause 