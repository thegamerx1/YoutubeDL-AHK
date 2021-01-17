class MyGui {
	init() {
		this.gui := new EzGui(this, {w: 500
			,h: 720
			,title: "Youtube Downloader"
			,caption: false
			,fixsize: true
			,browser: true
			,browserhtml: "web/"})

		configFile.data := EzConf(configFile.data, {ffmpegpath: "bin\ffmpeg.exe", ytdlpath: "bin\youtube-dl.exe"})
		OnExit(ObjBindMethod(this, "save"))
		this.gui.inithooks()
		this.gui.visible := true
		this.checkConf()
		this.reloadYTDL()
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
			this.gui.wnd.showFileDialog("Download folder", true)
			return
		}
		if !FileExist(configFile.data.ytdlpath) {
			this.gui.wnd.showFileDialog("Youtube-dl")
			return
		}
		if !FileExist(configFile.data.ffmpegpath) {
			this.gui.wnd.showFileDialog("Ffmpeg")
			return
		}
		return 1
	}

	chooseFile(type) {
		Switch type {
			case "Youtube-dl":
				configFile.data.ytdlpath := this._chooseFile("Choose Youtube-dl path", "Youtube-dl (*.exe)")
			case "Ffmpeg":
				configFile.data.ffmpegpath := this._chooseFile("Choose ffmpeg path", "Ffmpeg (*.exe)")
			case "Download folder":
				configFile.data.downpath := this._chooseFolder("Choose download path")
		}
	}

	downloadFile(type) {
		if !FileExist("bin/") {
			FileCreateDir bin/
		}
		Switch type {
			case "Youtube-dl":
				url := "https://yt-dl.org/downloads/2021.01.16/youtube-dl.exe"
				file := "bin/youtube-dl.exe"
			case "Ffmpeg":
				url := "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full.7z"
				file := "bin/ffmpeg-extactme.7z"
		}
		download := new fileDownloader(url, file, ObjBindMethod(this, "fileDownload"))
		if (type = "ffmpeg") {

		}
		Switch type {
			case "Youtube-dl":
				configFile.data.ytdlpath := file
			case "Ffmpeg":
				MsgBox Ffmpeg has been downloaded please extact the file manually`nFFmpeg.exe should be at the bin folder inside the 7z, File downloaded
		}
	}

	fileDownload(args*) {
		this.gui.wnd.fileProgress(args*)
	}

	_chooseFolder(text) {
		FileSelectFolder, folder, ::{20d04fe0-3aea-1069-a2d8-08002b30309d},, %text%
		return folder
	}

	_chooseFile(title, filter) {
		FileSelectFile, file, 1, ::{20d04fe0-3aea-1069-a2d8-08002b30309d}, %title%, %filter%
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

	setConf() {
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