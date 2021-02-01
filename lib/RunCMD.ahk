RunCMD(CmdLine, Fn:="", stopFunc := "",  WorkingDir:="", Codepage:="CP0") {
	;         RunCMD v0.94
	; RunCMD v0.94 by SKAN on D34E/D37C @ autohotkey.com/boards/viewtopic.php?t=74647
	; Based on StdOutToVar.ahk by Sean @ autohotkey.com/board/topic/15455-stdouttovar
	local
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
		DllCall("CloseHandle", "Ptr", hPipeW)
		DllCall("CloseHandle", "Ptr", hPipeR)
	}

	DllCall("CloseHandle", "Ptr",hPipeW)
	File := FileOpen(hPipeR, "h", Codepage)

	sOutput := ""
	callfunc := (IsObject(Fn))
	stpfunc := (IsObject(stopFunc))
	Critical off
	While DllCall("PeekNamedPipe", "Ptr",hPipeR, "Ptr", 0, "Int", 0, "Ptr", 0, "Ptr", 0, "Ptr", 0) {
		notcalled := true
        While (Line := File.ReadLine()) {
			sOutput .= callfunc ? Fn.Call(Line, 0) : Line
			notcalled := false
		}
		if (stpfunc && stopFunc.call())
			break
		if (notcalled)
			sleep 100
	}


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