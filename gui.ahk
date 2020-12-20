class MyGui {
	init() {
		this.gui := new EzGui(this, {w: 500
			,h: 600
			,title: "Youtube Downloader"
			,options: "-MinimizeBox -MaximizeBox"
			,caption: false
			,fixsize: true
			,browser: true
			,browserhtml: "web/index.html"})

		this.gui.inithooks()
		this.gui.visible := true
		configFile.data := EzConf(configFile.data, {})
		this.ytdlopts := "cmdyoutube-dl.exe --config-location """ A_ScriptDir "/youtube-dl.conf"""
		this.videoarray := []
	}

	checkConf() {
		if !FileExist(configFile.data.path) {
			FileSelectFolder, file, ::{20d04fe0-3aea-1069-a2d8-08002b30309d},, Download path was invalid.`nDownload videos to:
			if !file {
				ExitApp 1
			}
			configFile.data.path := file
			configFile.save()
		}
	}

	getVideoData(url) {
		this.gui.wnd.setProgress("getData", 95)
		command := this.ytdlopts " -J " url
		jsonraw := RunCMD(command)
		this.gui.wnd.setProgress("getData", 100)
		try {
			this.jsondata := JSON.load(jsonraw)
		} catch e {
			return false
		}
		return jsonraw
	}

	getConf() {
		return JSON.dump(configFile.data)
	}

	openFolder() {
		Run
	}

	setConf(data) {
		configFile.data := JSON.load(data)
		configFile.save()
	}

	refresh(id, out, finished) {
		if RegExMatch(out, "O)\[download\]\s+(?<percent>[\d\.]+)%\s+of\s+(?<size>[\d\.\w]+)\sat\s+(?<speed>[\d\.\w]+\/s)\sETA\s(?<ETA>[\d:]+)", match) {
			this.gui.wnd.updateProgress(id, match.percent, match.eta, match.speed, match.size)
		}
		if (finished) {
			this.gui.wnd.updateProgress(id, "100")
		}
		this.gui.wnd.log(id, out)
	}

	downloadVideo(qid, audio) {
		command := this.ytdlopts " -o " configFile.data.path "\%(title)s.%(ext)s -f " qid (audio ? "+bestaudio " : " ") this.jsondata.webpage_url
		debug.print("Downloading video: " this.jsondata.title " - " qid " " audio)
		RunCMD(command, objbindmethod(this, "refresh", this.jsondata.id))
	}
}