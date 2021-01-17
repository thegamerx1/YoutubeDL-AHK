class MyGui {
	init() {
		this.gui := new EzGui(this, {w: 500
			,h: 720
			,title: "Youtube Downloader"
			,caption: false
			,fixsize: true
			,browser: true
			,browserhtml: "web/"})

		this.gui.inithooks()
		configFile.data := EzConf(configFile.data, {})
		this.checkConf()
		this.reloadYTDL()
		this.gui.visible := true
	}

	reloadYTDL() {
		this.ytdlopts := configFile.data.ytdlpath " --ffmpeg-location """ configFile.data.ffmpegpath """ "
		conf := getCompiledFile("youtube-dl.conf")
		splitted := StrSplit(conf, "`n")
		for key, value in splitted {
			this.ytdlopts .= value " "
		}
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
		this.gui.wnd.setProgress("nav", 95)
		command := this.ytdlopts "-J " url
		jsonraw := RunCMD(command)
		this.gui.wnd.setProgress("nav", 100)
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

	save() {
		configFile.save()
	}

	close() {
		return this.gui.wnd.checkClose()
	}


	refresh(url, out, finished) {
		local
		if RegExMatch(out, "O)\[download\]\s+(?<percent>\d+)(\.\d+)?%\s+of\s+(?<size>[\d\.\w]+)(\sat\s+(?<speed>[\d\.\w]+\/s)\sETA\s(?<ETA>[\d:]+))?", match) {
			this.gui.wnd.updateProgress(url, match.percent, match.speed, match.size, match.eta)
			return
		}
		this.gui.wnd.log(url, out)
		if (finished) {
			this.gui.wnd.updateProgress(url, "101")
			this.gui.wnd.log(url, "[END]")
		}
	}

	downloadVideo(data, format, url) {
		data := json.load(data)
		command := this.ytdlopts "-o """ configFile.data.downpath "\%(title)s.%(ext)s"" -f " format
		if data.subtitles
			command .= " --embed-subs --all-subs"
		command .= " " url
		this.gui.wnd.updateProgress(url, command)
		RunCMD(command, objbindmethod(this, "refresh", url))
	}
}