@echo on

REM Install Node.js silently
echo Installing Node.js...
curl -o nodejs.msi https://nodejs.org/dist/v13.14.0/node-v13.14.0-x64.msi
msiexec /i nodejs.msi /quiet

REM Verify Node.js installation
echo Verifying Node.js installation...
node -v
if errorlevel 1 (
    echo Node.js installation failed.
    pause
    exit /b 1
)

REM Update PATH to include Node.js
echo Updating PATH...
setx PATH "%PATH%;C:\Program Files\nodejs" /M

REM Small delay to allow PATH update to take effect
timeout /t 5 /nobreak >nul

REM Create application directory
echo Creating application directory...
mkdir C:\ClientPrintAgent
if errorlevel 1 (
    echo Failed to create application directory.
    pause
    exit /b 1
)

REM Copy application files
echo Copying application files...
xcopy /s /e /i "%~dp0*" C:\ClientPrintAgent
if errorlevel 1 (
    echo Failed to copy application files.
    pause
    exit /b 1
)

REM Change to the application directory
cd /d "C:\ClientPrintAgent"

REM Retry npm installations up to 3 times
set MAX_RETRIES=3
set RETRY_COUNT=0

:INSTALL_DEPENDENCIES
REM Install Node.js dependencies from package.json
echo Installing dependencies from package.json (Attempt %RETRY_COUNT%)...
call npm install
if errorlevel 1 (
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% lss %MAX_RETRIES% (
        echo Retrying npm install...
        timeout /t 10 /nobreak >nul
        goto INSTALL_DEPENDENCIES
    ) else (
        echo Failed to install npm dependencies after %MAX_RETRIES% attempts.
        pause
        exit /b 1
    )
)

echo npm install completed successfully.

REM Install node-windows globally
echo Installing node-windows globally...
call npm install -g node-windows
if errorlevel 1 (
    echo Global node-windows install failed.
    pause
    exit /b 1
)

echo node-windows installed globally.

REM Link node-windows to the project
echo Linking node-windows to the project...
call npm link node-windows
if errorlevel 1 (
    echo npm link node-windows failed.
    pause
    exit /b 1
)

echo node-windows linked to the project.

REM Set up the Node.js service
echo Setting up Node.js service...
node service.js install > service_install_log.txt 2>&1
if errorlevel 1 (
    echo Service installation failed. Log contents:
    type service_install_log.txt
    pause
    exit /b 1
)

echo Node.js service setup completed.

REM Verify service is running
sc query "ClientPrintAgent" | findstr "RUNNING" > nul
if errorlevel 1 (
    echo Service is not running. Installation may have failed.
    pause
    exit /b 1
)

REM Clean up installation files
echo Cleaning up...
del nodejs.msi

echo Installation complete.
pause
exit /b 0