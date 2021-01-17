#Include <mustExec>
#NoTrayIcon
Debug.init()


global configFile := new configloader("settings.json")
MyGui.init()
Return

#Include gui.ahk
#Include <debug>
#Include <fileDownloader>
#Include <RunCMD>
#Include <configloader>
#Include <EzGui>

FileInstall web/minify/index.html, ~
FileInstall youtube-dl.conf, ~