#Include <mustExec>
#NoTrayIcon
Debug.init()

global configFile := new configloader("settings.json")
global videoFile := new configloader("videos.json")
MyGui.init()
Return

;@Ahk2Exe-SetMainIcon icon.ico
;@Ahk2Exe-UpdateManifest 0, Youtube Downloader
;@Ahk2Exe-SetVersion 1.7
;@Ahk2Exe-ExeName Youtube-Downloader.exe

FileInstall youtube-dl.conf, ~
FileInstall web/minify/index.html, ~

#Include gui.ahk
#Include <debug>
#Include <fileDownloader>
#Include <counter>
#Include <RunCMD>
#Include <configloader>
#Include <UnZip>
#Include <EzGui>