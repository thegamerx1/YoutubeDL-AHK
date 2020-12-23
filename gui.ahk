class MyGui {
	init() {
		this.gui := new EzGui(this, {w: 520
			,h: 720
			,title: "Youtube Downloader"
			,caption: false
			; ,resize: true
			,fixsize: true
			,browser: true
			,browserhtml: "web/index.html"})

		this.gui.inithooks()
		this.gui.visible := true
		configFile.data := EzConf(configFile.data, {})
		this.reloadYTDL()
		this.checkConf()
		OnExit(ObjBindMethod(this, "close"))
	}

	reloadYTDL() {
		this.ytdlopts := configFile.data.ytdlpath " --ffmpeg-location """ configFile.data.ffmpegpath """ --config-location """ A_ScriptDir "/youtube-dl.conf"" "
		Debug.print(this.ytdlopts)
	}

	checkConf() {
		if !FileExist(configFile.data.downpath) {
			configFile.data.downpath := this.chooseFolder("Download videos to:")
		}
		if !FileExist(configFile.data.ytdlpath) {
			configFile.data.ytdlpath := this.chooseFile("Youtube DL (*.exe)")
		}
		if !FileExist(configFile.data.ffmpegpath) {
			configFile.data.ffmpegpath := this.chooseFile("Ffmpeg (*.exe)")
		}
	}

	chooseFolder(text, bypass := false) {
		FileSelectFolder, folder, ::{20d04fe0-3aea-1069-a2d8-08002b30309d},, %text%
		if (!bypass && !folder)
			ExitApp 1
		return folder
	}

	chooseFile(filter, bypass := false) {
		FileSelectFile, file, 1, ::{20d04fe0-3aea-1069-a2d8-08002b30309d},, %filter%
		if (!bypass && !file)
			ExitApp 1
		return file
	}

	getVideoData(url) {
		this.gui.wnd.setProgress("getData", 95)
		command := this.ytdlopts "-J " url
		jsonraw := RunCMD(command)
		this.gui.wnd.setProgress("getData", 100)
		try {
			this.lastjson := JSON.load(jsonraw)
		} catch {
			this.gui.wnd.showErrorDialog("Error parsing video", jsonraw)
			return
		}
		if !A_IsCompiled
			clipboard := jsonraw
		return jsonraw
	}

	getConf() {
		return JSON.dump(configFile.data)
	}

	setConf(data) {
		configFile.data := JSON.load(data)
		this.reloadYTDL()
	}

	openFolder() {
		Run % configFile.data.downpath
	}

	close(Reason := "") {
		if !ifIn(Reason, "Shutdown,Single") {
			MsgBox, 4, Exit, Are you sure you want to exit?
			IfMsgBox No
				return 1
		}
		configFile.save()
	}


	refresh(id, out, finished) {
		if RegExMatch(out, "O)\[download\]\s+(?<percent>\d+)(\.\d+)?%\s+of\s+(?<size>[\d\.\w]+)(\sat\s+(?<speed>[\d\.\w]+\/s)\sETA\s(?<ETA>[\d:]+))?", match) {
			this.gui.wnd.updateProgress(id, match.percent, match.speed, match.size, match.eta)
		}
		this.gui.wnd.log(id, out)
		if (finished) {
			this.gui.wnd.updateProgress(id, "101")
			this.gui.wnd.log(id, "[END]")
		}
	}

	downloadVideo(data) {
		data := json.load(data)
		command := this.ytdlopts "-o """ configFile.data.downpath "\%(title)s.%(ext)s"" -f " data.quality
		if data.audio
			command .= "+bestaudio"
		if data.subtitles
			command .= " --embed-subs --all-subs"
		command .= " " this.lastjson.webpage_url
		this.gui.wnd.updateProgress(this.lastjson.id, command)
		error := RunCMD(command, objbindmethod(this, "refresh", this.lastjson.id))
	}
}