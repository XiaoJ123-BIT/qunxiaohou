!macro customInstall
  ; Auto-run wechat-cli setup after installation
  ExecWait '"$INSTDIR\resources\setup-wechat-cli.bat" auto'
!macroend
