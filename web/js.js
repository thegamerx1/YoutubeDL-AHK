function ready() {
	templates = generateTemplates()
	modals = {
		videoquality: $("#videoqualitymodal"),
		settings: $("#settingsModal"),
		console: $("#consoleModal"),
		confirmClose: $("#confirmClose"),
		error: $("#errorModal"),
		file: $("#fileModal"),
		videoExists: $("#videoExistsModal"),
		delete: $("#deleteDialog"),
	}

	const modal = modals.videoquality
	els = {
		videoUrl: $("#videoUrl"),
		videolist: $("#videolist"),
		qualitySelect: modal.find("select[name=quality]"),
		formatSelect: modal.find("select[name=format]"),
	}

	data = {
		logs: {},
		config: {},
		queueReady: true,
		queue: [],
	}
	$("form").submit(false)
	console.log("Ready")
	removeLoader()
}

function debug() {
	// modals.videoquality.modal("show")
	let response = {
		title: "LOREM LOREM LOREM LOREM LOREM LOREM LOREM",
		formats: [
			{ format_id: 123, format_note: "0 - 720p60" },
			{ format_id: 114, format: "test" },
		],
		thumbnails: [{ url: "https://i.ytimg.com/vi/nI8Q1bqT8QU/hqdefault.jpg" }],
		url: "asdasd",
		webpage_url: "h3nt41/sdasdad",
	}

	let video = addVideo(123, response)
	setVideo(video, response)
	video
		.find(".image")
		.css(
			"background-image",
			"url(file:///C:/Users/TheGamerX/Documents/MEGAsync/Files/[%20Images%20]/[%20Wallpapers%20]/[%20Desktop%20]/Abstract-Wave-4K-Wallpaper-3840x2160.jpg)"
		)
	debugg = {
		downpercent: 0,
		url: response.webpage_url,
	}
	debuggy()
}

// ? Simulate download in browser for developing epic progressbar
function debuggy() {
	debugg.downpercent += random(5, 10)
	if (debugg.downpercent > 100) debugg.downpercent = 0
	if (random(1, 20) == 1) {
		updateProgress(debugg.url, "ERROR: DEBUG", 1)
		return
	}
	log(debugg.url, debugg.downpercent + "%\n")
	updateProgress(
		debugg.url,
		"[download]  " + debugg.downpercent + "% of 123MiB at " + random(9, 12) + "MiB/s ETA 01:48:52"
	)
	if (debugg.downpercent == 100) {
		debugg.nextpercent = 0
	}
	setTimeout(debuggy, random(50, 200))
}

function setConf() {
	console.log("Config set")
	let ahkData = JSON.parse(ahk.returnConf())
	data.config = ahkData.config
	data.ytdlopts = ahkData.command
}

function preaddVideo(videodata) {
	videodata = JSON.parse(videodata)
	console.log("Loading video: " + videodata.title)
	let video = addVideo(videodata.qid)
	video.find(".title").html(videodata.title)
	video.data("videoname", videodata.title)
	video.data("formdata", videodata.formdata)
	video.data("prevideo", videodata)
	video.data("paused", false)
	video.attr("url", videodata.url)

	video.find("[name=pause]").hide()
	video.find("[name=progress]").html("Restored")
	if (videodata.done) {
		video.find("[name=progress]").html("Downloaded")
		setProgress(video.find(".progress-bar"), 100)
		video.data("done", true)
	} else {
		setTimeout(function () {
			loadVideo(video)
		}, 65)
	}
}

function loadVideo(video) {
	let videodata = video.data("prevideo")
	try {
		const response = getVideoData(videodata.url)
		setVideoThumbnail(response)
		setVideo(video, response)
		video.find("[name=pause]").show()
		video.data("command", getCommand(videodata.formdata, videodata.qid, videodata.url))
		videoAction(video.find("[name=pause]"))
		video.data("prevideo", null)
	} catch (e) {
		log(videodata.url, e)
		video.find("[name=progress]").html("Error see logs")
		video.find("[name=retry]").show()
	}
}

function addVideo(qid, data) {
	let video = templates.video.contents("div").clone(true)
	video.data("qid", qid)
	video.find("[name=start]").hide()
	video.data("done", false)
	els.videolist.append(video)
	if (data) setVideo(video, data)
	return video
}

function setVideo(video, videodata) {
	let img = video.find(".image")
	let formatString
	$(videodata.formats).each(function () {
		if (this.format_id == video.data("qid")) {
			formatString = this.format_note ? this.format_note : this.format
			return false
		}
	})
	video.find("[name=format]").html(formatString)
	video.find(".title").html(videodata.title)
	video.data("formats", videodata.formats)
	video.attr("url", videodata.webpage_url)
	video.data("videoname", videodata.title)
	data.logs[videodata.webpage_url] = ""
	// img.prop("src", videodata.thumbnail)
	img.css("background-image", "url(" + videodata.thumbnail + ")")
}

function formatURL(e) {
	let regex = e.value.match(/(\w+:\/\/)(www\.)?(.+)/)
	if (regex) {
		e.value = regex[3]
		els.videoUrl.find("[name=protocol]").html(regex[1])
	} else {
		if ((regex = e.value.match(/^([\w-]{6,})$/))) {
			e.value = "youtube.com/watch?v=" + regex[1]
		}
	}
}

function getDataButton() {
	$(".progress[name=nav]").addClass("show")
	setProgress("nav", 0)
	setTimeout(function () {
		setProgress("nav", 20)
	}, 0)
	let data = formObject(els.videoUrl)
	els.videoUrl.find(":input").prop("disabled", true)
	let url = els.videoUrl.find("[name=protocol]").html() + data.video
	try {
		openVideoModal(getVideoData(url))
	} catch (e) {
		showErrorDialog("Error parsing", e.toString())
	}

	resetNav()
	els.videoUrl.find(":input").prop("disabled", false).val("")
}

function getVideoData(url) {
	try {
		var response = ahk.getVideoData(url)
		var parsed = JSON.parse(response)
	} catch (e) {
		let regex = response.match(/\[?error\]?:?\s+(.+)/i)
		throw regex ? regex[1] : e
	}

	return parsed
}

function resetNav() {
	setProgress("nav", 0)
	$(".progress[name=nav]").removeClass("show")
}

function queryPaused(url) {
	let video = getVideo(url)
	return video.length ? video.data("paused") : 1
}

function openVideoModal(response) {
	if (getVideo(response.webpage_url).attr("url")) {
		modals.videoExists.modal("show")
		return
	}

	console.log("Opening modal")

	let modal = modals.videoquality
	modal.modal("show")
	modal.find(".modal-title").html(response.title)
	modal.find(".downto").html(data.config.downpath)
	modal.find("input[name=showhidden]").prop("checked", true)
	modal.find("input[name=audio]").prop("checked", true)
	modal.find("input[name=subtitles]").prop("checked", false)
	modal.find("span[name=views]").html(response.view_count.toLocaleString())
	modal
		.find("span[name=time]")
		.html(new Date(response.duration * 1000).toISOString().substr(11, 8))
	modal.find("span[name=uploader]").html(response.uploader)
	let image = modal.find(".image img")
	image.prop("src", "")
	image.parent().addClass("loader")

	els.qualitySelect.empty()
	let formats = {}
	response.formats.forEach(function (format) {
		if (!formats.hasOwnProperty(format.format_note)) {
			formats[format.format_note] = []
			let option = document.createElement("option")
			option.value = format.format_note
			option.isAudio = format.format.includes("audio")
			option.innerHTML = option.isAudio ? "Audio" : format.format_note
			els.qualitySelect.append(option)
		}
		formats[format.format_note].push({ ext: format.ext, id: format.format_id, data: format.tbr })
	})
	response.new_formats = formats
	image.prop("src", response.thumbnail)
	image.parent().removeClass("loader")
	modal.data("video", response)
	updateQuality()
}

function updateQuality() {
	let modal = modals.videoquality
	let isAudio = els.qualitySelect.children("option:selected").prop("isAudio")
	modal.find("[name=isAudio]").val(isAudio)

	const qualityNote = els.qualitySelect.val()
	els.formatSelect.empty()
	$(modal.data("video").new_formats[qualityNote]).each(function () {
		let option = document.createElement("option")
		option.value = this.id
		option.innerHTML = this.ext + " " + Math.floor(this.data) + "kbps"
		els.formatSelect.append(option)
	})
}

function openSettingsModal(refreshOnly) {
	if (!refreshOnly) modals.settings.modal("show")
	setDataToForm(modals.settings, data.config)
}

function settingsSave() {
	modals.settings.modal("hide")
	setConf()
}

function downloadVideo() {
	modals.videoquality.modal("hide")
	let currentVideo = modals.videoquality.data("video")
	let formdata = formObject(document.forms["videoDownload"])
	let video = addVideo(formdata.format, currentVideo)
	const select = els.qualitySelect[0]
	let qualityOption = select.options[select.selectedIndex]
	var format = formdata.format
	video.data("formdata", formdata)
	video.data("isAudio", qualityOption.isAudio)
	if (!qualityOption.isAudio && formdata.audio) format += "+bestaudio/" + format
	video.data("command", getCommand(formdata, format, currentVideo.webpage_url))
	data.queue.push({ command: video.data("command"), url: currentVideo.webpage_url })
	checkQueue()
}

function getCommand(form, format, url) {
	if (!form.isAudio && form.audio) format += "+bestaudio/" + format
	let command = data.ytdlopts + ' -o "' + data.config.downpath + '/%(title)s.%(ext)s" -f ' + format
	if (form.subtitles) command += " --embed-subs --all-subs"
	command += " " + url
	return command
}

function checkQueue(ready) {
	setTimeout(function () {
		if (ready) data.queueReady = true
		if (!data.queueReady) return
		let video = data.queue.pop()
		if (!video) return
		if (queryPaused(video.url)) {
			data.queue.push(video)
			return
		}
		data.queueReady = false
		setTimeout(function () {
			ahk.downloadCommand(video.command, video.url)
			checkQueue(true)
		}, 0)
	}, 0)
}

function setProgress(name, value) {
	let progress =
		typeof name == "object" ? $(name) : $(".progress[name=" + name + "] .progress-bar")
	if (value == 0) {
		progress.addClass("notransition")
		setTimeout(function () {
			progress.removeClass("notransition")
		}, 200)
	}
	progress.css("width", value + "%")
}

function updateProgress(url, message, finished) {
	var video = getVideo(url)
	if (video.data("paused") || video.data("done")) return
	if (finished == 5) {
		video.data("command", message)
		return
	}
	let progressbar = video.find(".progress-bar")

	let percent = ""
	let size = ""
	let speed = ""
	let msgprogress = ""
	let match = message.match(
		/\[download\]\s+([\d\.]+)%\s+of\s+([\~\d\.\w]+)(\s+at\s+([\d\.\w\/]+)\s+ETA\s+([\d:]+))?/i
	)
	if (match) {
		percent = parseInt(match[1])
		size = match[2]
		speed = match[4]
	} else {
		if ((match = message.match(/\[download\]\s+([\d\.\w]+)\s+at\s+([\d\.\w\/]+)/i))) {
			percent = 25
			size = match[1]
			speed = match[2]
		}
	}

	if (!match) {
		log(url, message)
		let errormatch = message.match(/\[?error\]?:?\s+(.+)/i)
		var errormsg = errormatch ? errormatch[1] : null
		if (finished) {
			video.data("done", true)

			if (video.data("downpercent") !== 100 || errormatch) {
				msgprogress = errormsg ? errormsg : "Error"
				video.addClass("error")
			} else {
				msgprogress = "Downloaded"
			}
			video.find("[name=pause]").hide()
			percent = 100
		} else {
			let matchy = message.match(
				/^(\[(?!download)(\w+)\]\s+(.+?))(?:(\s+)?(into|in|to|\:)\s+(\"|\')?\w\:.*)?$/i
			)
			if (matchy) msg = matchy[3]
		}
	} else {
		msgprogress = percent + "% " + speed
	}

	if (!video.data("setOnce") && size) {
		video.data("setOnce", true)
		video.find("[name=size]").html(size)
		msg = "Downloading"
	}

	if (Number.isFinite(percent)) {
		setProgress(progressbar, percent)
		video.data("downpercent", percent)
	}
	if (msgprogress) video.find("[name=progress]").html(msgprogress)
}

function saveVideos() {
	let data = []
	els.videolist.find("> .video").each(function () {
		let e = $(this)
		data.push({
			done: e.data("done"),
			url: e.attr("url"),
			title: e.data("videoname"),
			qid: e.data("qid"),
			formdata: e.data("formdata"),
		})
	})
	return JSON.stringify(data)
}

function videoAction(e) {
	e = $(e)
	e.prop("disabled", true)
	let video = e.closest(".video")
	let url = video.attr("url")
	switch (e.attr("name")) {
		case "remove":
			if (video.data("done")) {
				video.remove()
				delete data.logs[url]
			} else {
				modals.delete.modal("show")
				modals.delete.data("url", url)
			}
			break
		case "logs":
			modals.console.modal("show")
			els.videolist.attr("logsactive", url)
			modals.console.find(".modal-title").html(video.data("videoname"))
			modals.console.find("[name=command]").val(video.data("command"))
			modals.console.find("[name=url]").html(video.attr("url"))
			modals.console.find(".console code").html(data.logs[url])
			break
		case "pause":
			let status = video.data("paused")
			let paused = !status
			video.data("paused", paused)
			video.toggleClass("paused", paused)
			e.html(paused ? "Resume" : "Pause")
			video.find("[name=progress]").html(status ? "Resumed" : "Paused")
			if (status) {
				data.queue.push({ command: video.data("command"), url: url })
				checkQueue()
			}
			break
		case "retry":
			loadVideo(video)
			break
	}
	e.prop("disabled", "")
}

function getVideo(url) {
	return els.videolist.find('> .video[url="' + url + '"]')
}

function setLogs() {
	els.videolist.attr("logsactive", 0)
}

function deleteDialog(action) {
	if (action) {
		getVideo(modals.delete.data("url")).remove()
	}
}

function log(url, text) {
	data.logs[url] += text
	let textarea = modals.console.find(".console code")[0]
	if (els.videolist.attr("logsactive") == url) {
		textarea.innerHTML = data.logs[url]
		textarea.scrollTop = textarea.scrollHeight
	}
}

function showErrorDialog(title, text) {
	let modal = modals.error
	console.log(text)
	modal.modal("show")
	modal.find(".modal-title").html(title)
	modal.find(".console code").html(text)
}
function showFileDialog(file, isLocal) {
	let modal = modals.file
	modal.find(".btn-secondary").prop("disabled", isLocal ? true : "")
	modal.data("file", file)
	modal.modal("show")
	modal.find(".file").html(file)
}

function chooseFile(type) {
	ahk.chooseFile(type)
	openSettingsModal(true)
}

function fileDialog(action) {
	let modal = modals.file
	switch (action) {
		case "choose":
			ahk.chooseFile(modal.data("file"))
			break
		case "download":
			modal.find(".btn-secondary").prop("disabled", true)
			ahk.downloadFile(modal.data("file"))
			break
	}
	if (ahk.checkConf()) modal.modal("hide")
}

function fileProgress(percent, speed) {
	modals.file.find("[name=info]").html(percent + "% " + speed)
	setProgress("fileModal", percent)
}

function checkClose() {
	let hasUnDoneVideos = false
	els.videolist.find("> .video").each(function () {
		let e = $(this)
		if (!e.data("paused") && !e.data("done")) {
			hasUnDoneVideos = true
			return false
		}
	})
	if (hasUnDoneVideos) {
		modals.confirmClose.modal("show")
	} else {
		gui.exit()
	}
	return hasUnDoneVideos
}
