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
		configFile.data := EzConf(configFile.data, {ffmpegpath: "bin\ffmpeg.exe", ytdlpath: "bin\youtube-dl.exe"})
		OnExit(ObjBindMethod(this, "save"))
		this.checkConf()
		this.gui.visible := true
		this.gui.wnd.setConf()
		for _, value in videoFile.data {
			this.gui.wnd.preaddVideo(JSON.dump(value))
		}
	}

	reloadYTDL() {
		this.ytdlopts := configFile.data.ytdlpath " "
		if (configFile.data.ffmpegpath != "ffmpeg.exe") {
			this.ytdlopts .= "--ffmpeg-location """ configFile.data.ffmpegpath """ "
		}
		conf := getCompiledFile("youtube-dl.conf")
		splitted := SplitLine(conf)
		for key, value in splitted {
			this.ytdlopts .= value " "
		}
		this.gui.wnd.data.ytdlopts := this.ytdlopts
	}

	checkConf() {
		if !FileExist(configFile.data.downpath) {
			this.gui.wnd.showFileDialog("Download folder", true)
			return
		}

		foundyt := this.tryFindBinary([{name: "yt-dlp.exe", args: "--version"}, {name: "youtube-dl.exe", args: "--version"}])
		if foundyt {
			configFile.data.ytdlpath := foundyt.command.name
		} else {
			if !FileExist(configFile.data.ytdlpath) {
				this.gui.wnd.showFileDialog("Youtube-dl")
				return
			}
		}

		foundffmpeg := this.tryFindBinary([{name: "ffmpeg.exe", args: "-version"}])
		if foundffmpeg {
			configFile.data.ffmpegpath := foundffmpeg.command.name
		} else {
			if !FileExist(configFile.data.ffmpegpath) {
				this.gui.wnd.showFileDialog("Ffmpeg")
				return
			}
		}

		return 1
	}

	tryFindBinary(commands) {
		for _, com in commands {
			value := RunCMD(com.name " " com.args)
			if value {
				return {command: com, value: value}
			}
		}
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
		local download
		local url
		local file
		FileCreateDir bin/
		Switch type {
			case "Youtube-dl":
				url := "https://yt-dl.org/downloads/2021.01.16/youtube-dl.exe"
				file := "bin/youtube-dl.exe"
			case "Ffmpeg":
				url := "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
				file := "bin/ffmpeg-extactme.zip"
		}
		download := new fileDownloader(url, file, ObjBindMethod(this, "fileDownload"))
		Switch type {
			case "Youtube-dl":
				configFile.data.ytdlpath := file
			case "Ffmpeg":
				this.gui.wnd.fileProgress(0)
				UnZip("bin/ffmpeg-extactme.zip", "ffmpeg.exe", "bin/ffmpeg.exe")
				this.gui.wnd.fileProgress(90)
				FileDelete bin/ffmpeg-extactme.zip
				this.gui.wnd.fileProgress(100)
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
		command := this.ytdlopts " -J " url
		jsonraw := RunCMD(command)
		this.gui.wnd.setProgress("nav", 100)
		return jsonraw
	}

	returnConf() {
		this.reloadYTDL()
		return JSON.dump({command: this.ytdlopts, config: configFile.data})
	}

	openFolder() {
		Run % configFile.data.downpath
	}

	save() {
		videoFile.data := JSON.load(this.gui.wnd.saveVideos())
		configFile.save()
		videoFile.save()
	}

	close() {
		return this.gui.wnd.checkClose()
	}

	output(args*) {
		this.gui.wnd.updateProgress(args*)
	}

	checkPaused(url) {
		return this.gui.wnd.queryPaused(url)
	}

	downloadCommand(command, url) {
		RunCMD(command, objbindmethod(this, "output", url), ObjBindMethod(this, "checkPaused", url))
	}
}