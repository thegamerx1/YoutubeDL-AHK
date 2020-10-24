#Include <mustExec>
#Include <debug>
#Include <runner>
#Include <configloader>
#Include <EzGui>
#Include <timer>
#Include gui.ahk
#NoTrayIcon
Debug.init()

global configFile := new configloader("settings.json", "Config")
MyGui.create()
Return