@echo off
chcp 65001 >nul 2>&1
title 群小猴 - 环境配置
echo.
echo  ========================================
echo    群小猴 - 正在配置运行环境...
echo  ========================================
echo.

:: Check if wechat-cli is already available
where wechat-cli >nul 2>&1
if %errorlevel%==0 (
    echo [OK] wechat-cli 已安装
    goto :done
)

:: Check Python versions
set PYTHON_CMD=
python --version >nul 2>&1
if %errorlevel%==0 set PYTHON_CMD=python
python3 --version >nul 2>&1
if %errorlevel%==0 set PYTHON_CMD=python3
py --version >nul 2>&1
if %errorlevel%==0 set PYTHON_CMD=py

if "%PYTHON_CMD%"=="" (
    echo [!] 未检测到 Python，正在下载便携版 Python...
    goto :install_portable_python
)

echo [OK] 检测到 Python
echo [*] 正在安装 wechat-cli...
%PYTHON_CMD% -m pip install wechat-cli --quiet 2>nul
if %errorlevel%==0 (
    echo [OK] wechat-cli 安装成功！
    goto :done
)

echo [!] pip 安装失败，尝试使用便携版 Python...
goto :install_portable_python

:install_portable_python
set "PYDIR=%LOCALAPPDATA%\群小猴\python"
set "WCDIR=%LOCALAPPDATA%\群小猴\wechat-cli"

if exist "%WCDIR%\wechat-cli.exe" (
    echo [OK] 便携版 wechat-cli 已存在
    goto :done
)

echo [*] 正在下载 Python 3.11 便携版...
mkdir "%LOCALAPPDATA%\群小猴" >nul 2>&1

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host '  下载中...'; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip' -OutFile '%PYDIR%.zip'}" 2>nul
if not exist "%PYDIR%.zip" (
    echo [!] 下载失败，请手动安装：
    echo     1. 安装 Python: https://www.python.org/downloads/
    echo     2. 运行: pip install wechat-cli
    echo     3. 重新打开群小猴
    pause
    exit /b 1
)

echo [*] 解压 Python...
mkdir "%PYDIR%" >nul 2>&1
powershell -Command "Expand-Archive -Path '%PYDIR%.zip' -DestinationPath '%PYDIR%' -Force" 2>nul
del "%PYDIR%.zip" >nul 2>&1

echo [*] 配置 pip...
echo [Paths]> "%PYDIR%\python311._pth"
echo Lib=Lib>> "%PYDIR%\python311._pth"
echo Lib\site-packages>> "%PYDIR%\python311._pth"
echo .>> "%PYDIR%\python311._pth"
echo import site>> "%PYDIR%\python311._pth"

echo [*] 下载 pip...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%PYDIR%\get-pip.py'}" 2>nul
"%PYDIR%\python.exe" "%PYDIR%\get-pip.py" --quiet 2>nul
del "%PYDIR%\get-pip.py" >nul 2>&1

echo [*] 安装 wechat-cli...
"%PYDIR%\python.exe" -m pip install wechat-cli --quiet 2>nul
if %errorlevel%==0 (
    echo [*] 创建启动器...
    echo @echo off> "%WCDIR%.bat"
    echo "%PYDIR%\Scripts\wechat-cli.exe" %%*>> "%WCDIR%.bat"
    echo [OK] wechat-cli 安装成功！
    goto :done
)

echo [!] 安装失败，请手动安装：
echo     1. 安装 Python: https://www.python.org/downloads/
echo     2. 运行: pip install wechat-cli
echo     3. 重新打开群小猴
pause
exit /b 1

:done
echo.
echo  ========================================
echo    配置完成！请重新打开群小猴
echo  ========================================
echo.
if "%1"=="" pause
exit /b 0
