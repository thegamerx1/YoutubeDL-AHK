#include <timer>
RunCMD(CmdLine, Fn:="", WorkingDir:="", Codepage:="CP0") {  ;         RunCMD v0.94
	; RunCMD v0.94 by SKAN on D34E/D37C @ autohotkey.com/boards/viewtopic.php?t=74647
	; Based on StdOutToVar.ahk by Sean @ autohotkey.com/board/topic/15455-stdouttovar
	DllCall("CreatePipe", "PtrP",hPipeR:=0, "PtrP",hPipeW:=0, "Ptr",0, "Int",0)
	DllCall("SetHandleInformation", "Ptr",hPipeW, "Int",1, "Int",1)
	DllCall("SetNamedPipeHandleState","Ptr",hPipeR, "UIntP",PIPE_NOWAIT:=1, "Ptr",0, "Ptr",0)

	P8 := (A_PtrSize=8)
	VarSetCapacity(SI, P8 ? 104 : 68, 0)                          ; STARTUPINFO structure
	NumPut(P8 ? 104 : 68, SI)                                     ; size of STARTUPINFO
	NumPut(STARTF_USESTDHANDLES:=0x100, SI, P8 ? 60 : 44,"UInt")  ; dwFlags
	NumPut(hPipeW, SI, P8 ? 88 : 60)                              ; hStdOutput
	NumPut(hPipeW, SI, P8 ? 96 : 64)                              ; hStdError
	VarSetCapacity(PI, P8 ? 24 : 16)                              ; PROCESS_INFORMATION structure

	if !DllCall("CreateProcess", "Ptr",0, "Str",CmdLine, "Ptr",0, "Int",0, "Int",True ,"Int",0x08000000 | DllCall("GetPriorityClass", "Ptr",-1, "UInt"), "Int",0 ,"Ptr",WorkingDir ? &WorkingDir : 0, "Ptr",&SI, "Ptr",&PI) {
		Return Format("{1:}", "", ErrorLevel := -1)
		DllCall("CloseHandle", "Ptr",hPipeW)
		DllCall("CloseHandle", "Ptr",hPipeR)
	}

	DllCall("CloseHandle", "Ptr",hPipeW)
	File := FileOpen(hPipeR, "h", Codepage)

	sOutput := ""
	While DllCall("PeekNamedPipe", "Ptr",hPipeR, "Ptr",0, "Int",0, "Ptr",0, "Ptr",0, "Ptr",0)
        While (Line := File.ReadLine())
			sOutput .= Fn ? Fn.Call(Line, 0) : Line


	Fn.Call(Line, 1)
	hProcess := NumGet(PI, 0)
	hThread  := NumGet(PI, A_PtrSize)

	DllCall("GetExitCodeProcess", "Ptr",hProcess, "PtrP", ExitCode := 0)
	DllCall("CloseHandle", "Ptr",hProcess)
	DllCall("CloseHandle", "Ptr",hThread)
	DllCall("CloseHandle", "Ptr",hPipeR)

	ErrorLevel := ExitCode
	Return sOutput
}

; class SyncRunCMD {
; 	__New(cmdline, fn, WorkingDir:="", Codepage:="CP0") {
; 		this.fn := fn
; 		DllCall("CreatePipe", "PtrP",this.hPipeR:=0, "PtrP",hPipeW:=0, "Ptr",0, "Int",0)
; 		DllCall("SetHandleInformation", "Ptr",hPipeW, "Int",1, "Int",1)
; 		DllCall("SetNamedPipeHandleState","Ptr",this.hPipeR, "UIntP",PIPE_NOWAIT:=1, "Ptr",0, "Ptr",0)

; 		P8 := (A_PtrSize=8)
; 		VarSetCapacity(SI, P8 ? 104 : 68, 0)                          ; STARTUPINFO structure
; 		NumPut(P8 ? 104 : 68, SI)                                     ; size of STARTUPINFO
; 		NumPut(STARTF_USESTDHANDLES:=0x100, SI, P8 ? 60 : 44,"UInt")  ; dwFlags
; 		NumPut(hPipeW, SI, P8 ? 88 : 60)                              ; hStdOutput
; 		NumPut(hPipeW, SI, P8 ? 96 : 64)                              ; hStdError
; 		VarSetCapacity(this.PI, P8 ? 24 : 16)                              ; PROCESS_INFORMATION structure

; 		if !DllCall("CreateProcess", "Ptr",0, "Str",CmdLine, "Ptr",0, "Int",0, "Int",True ,"Int",0x08000000 | DllCall("GetPriorityClass", "Ptr",-1, "UInt"), "Int",0 ,"Ptr",WorkingDir ? &WorkingDir : 0, "Ptr",&SI, "Ptr",&this.PI) {
; 			Return Format("{1:}", "", ErrorLevel := -1)
; 			DllCall("CloseHandle", "Ptr",hPipeW)
; 			DllCall("CloseHandle", "Ptr",this.hPipeR)
; 		}

; 		DllCall("CloseHandle", "Ptr",hPipeW)
; 		this.File := FileOpen(this.hPipeR, "h", Codepage)
; 		this.LineNum := 1

; 		this.checky := new timer(ObjBindMethod(this, "checkPoll"), 100)
; 	}

; 	checkPoll() {
; 		debug.print("call poll")
; 		if DllCall("PeekNamedPipe", "Ptr",this.hPipeR, "Ptr",0, "Int",0, "Ptr",0, "Ptr",0, "Ptr",0) {
; 			While (Line := this.File.ReadLine()) {
; 				this.fn.Call(Line, this.LineNum++)
; 				debug.print("foundsomething!" Line " " this.LineNum)
; 			}
; 		} else {
; 			debug.print("done pipe")
; 			hProcess := NumGet(this.PI, 0)
; 			hThread  := NumGet(this.PI, A_PtrSize)

; 			DllCall("GetExitCodeProcess", "Ptr",hProcess, "PtrP", ExitCode := 0)
; 			DllCall("CloseHandle", "Ptr",hProcess)
; 			DllCall("CloseHandle", "Ptr",hThread)
; 			DllCall("CloseHandle", "Ptr",this.hPipeR)
; 		}
; 	}
; }