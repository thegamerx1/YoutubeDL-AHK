#Include <mustExec>
#NoTrayIcon
Debug.init()


global configFile := new configloader("settings.json")
MyGui.init()
Return
;@Ahk2Exe-SetMainIcon icon.ico
;@Ahk2Exe-UpdateManifest 0, Youtube Downloader
;@Ahk2Exe-SetVersion 1.5
;@Ahk2Exe-ExeName Youtube-Downloader.exe

#Include gui.ahk
#Include <debug>
#Include <fileDownloader>
#Include <regex>
#Include <RunCMD>
#Include <configloader>
#Include <UnZip>
#Include <EzGui>

FileInstall web/minify/index.html, ~
FileInstall youtube-dl.conf, ~