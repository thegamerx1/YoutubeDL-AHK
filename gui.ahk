class MyGui {
	init() {
		this.gui := new EzGui(this, {w: 500
			,h: 600
			,title: "Youtube Downloader"
			,caption: false
			,fixsize: true
			,browser: true
			,browserhtml: "web/index.html"})

		this.gui.inithooks()
		this.gui.visible := true
		configFile.data := EzConf(configFile.data, {})
		this.reloadYTDL()
		this.videoarray := []
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
		configFile.save()
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
			this.jsondata := JSON.load(jsonraw)
		} catch {
			this.gui.wnd.showErrorDialog("Error parsing video", jsonraw)
			return
		}
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
		if (Reason != "Shutdown") {
			MsgBox, 4, Exit, Are you sure you want to exit?
			IfMsgBox No
				return 1
		}
		configFile.save()
	}


	refresh(id, out, finished) {
		if RegExMatch(out, "O)\[download\]\s+(?<percent>\d+)(\.\d+)?%\s+of\s+(?<size>[\d\.\w]+)(\sat\s+(?<speed>[\d\.\w]+\/s)\sETA\s(?<ETA>[\d:]+))?", match) {
			this.gui.wnd.updateProgress(id, match.percent, match.speed, match.size)
			; debug.print(id " - " match.percent "% - " match.eta " - " match.speed " - " match.size)
		}
		this.gui.wnd.log(id, out)
		if (finished) {
			this.gui.wnd.updateProgress(id, "101")
			this.gui.wnd.log(id, "[END]")
		}
	}

	downloadVideo(qid, audio) {
		command := this.ytdlopts "-o """ configFile.data.downpath "\%(title)s.%(ext)s"" -f " qid (audio ? "+bestaudio " : " ") this.jsondata.webpage_url
		debug.print("Downloading video: " this.jsondata.title " - " qid " " audio)
		RunCMD(command, objbindmethod(this, "refresh", this.jsondata.id))
	}
}