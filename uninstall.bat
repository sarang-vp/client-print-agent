@echo off
setlocal enabledelayedexpansion

echo Starting uninstallation process...

REM Stop and remove the Node.js service
echo Stopping and removing ClientPrintAgent service...
sc stop "ClientPrintAgent"
sc delete "ClientPrintAgent"

REM Remove application directory
echo Removing application directory...
if exist C:\ClientPrintAgent (
    rd /s /q C:\ClientPrintAgent
    if !errorlevel! neq 0 (
        echo Failed to remove C:\ClientPrintAgent. Please delete it manually.
    )
)

REM Remove Node.js from PATH
echo Removing Node.js from PATH...
for /f "tokens=2*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH') do (
    set "NEW_PATH=%%B"
    set "NEW_PATH=!NEW_PATH:C:\Program Files\nodejs;=!"
    setx PATH "!NEW_PATH!" /M
)

REM Uninstall Node.js
echo Uninstalling Node.js...
wmic product where "name like 'Node.js%%'" call uninstall /nointeractive

REM Clean up any remaining files
echo Cleaning up...
if exist nodejs.msi del nodejs.msi

echo Uninstallation process completed.
echo Please restart your computer to ensure all changes take effect.
pause
exit /b 0