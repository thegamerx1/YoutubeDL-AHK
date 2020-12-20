#Include <mustExec>
#NoTrayIcon
Debug.init()


global configFile := new configloader("settings.json")
MyGui.init()
Return

#Include gui.ahk
#Include <debug>
#Include <RunCMD>
#Include <configloader>
#Include <EzGui>
#Include <timer>