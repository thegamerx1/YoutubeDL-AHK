function ready() {
	templates = generateTemplates()
	modals = {
		videoquality: $("#videoqualitymodal"),
		settings: $("#settingsModal"),
		console: $("#consoleModal"),
		confirmClose: $("#confirmClose"),
		error: $("#errorModal")
	}

	const modal = modals.videoquality // For clearer code
	els = {
		videoUrl: $("#videoUrl"),
		videolist: $("#videolist"),
		qualitySelect: modal.find("select[name=quality]"),
		formatSelect: modal.find("select[name=format]"),
	}

	data = {
		logs: {},
		queueReady: true,
		queue: [],
		currentVideo: null
	}

	$("form").submit(false)
	removeLoader()
}

function debug() {
	// modals.videoquality.modal("show")
	let currentVideo = {
		title: "LOREM LOREM LOREM LOREM LOREM LOREM LOREM",
		formats: [{ format_id: 0, format: "202 - 720p60" }],
		thumbnails: [{"url": "https://i.ytimg.com/vi/nI8Q1bqT8QU/hqdefault.jpg"}],
		id: "asdasd",
		webpage_url: "h3nt41/sdasdad"
	}
	addVideo(0, currentVideo)
	debugg = {
		downpercent: 0,
		downloops: 0,
		nextpercent: false,
		sentOnce: true,
		firstRun: true,
		url: currentVideo.webpage_url
	}
	debuggy()
}

// ? Simulate download in browser for developing epic progressbar
function debuggy() {
	debugg.downpercent += random(5, 10)
	if (debugg.downpercent > 100) {
		debugg.downpercent = 100
	}
	if (debugg.nextpercent) {
		debugg.percent = 0
		debugg.nextpercent = false
	}
	if (random(1, 20) == 5 && debugg.downloops >= 1) {
		debugg.downpercent = 101
	}
	log(debugg.url, debugg.downpercent + "%")
	updateProgress(debugg.url, debugg.downpercent, random(100, 8888) + "MB/s", "123MiB", random(10, 59) + ":" + random(10, 59))
	if (debugg.downpercent == 101) return
	if (debugg.downpercent == 100) {
		debugg.nextpercent = true
		debugg.downloops++
		debugg.downpercent = 0
	}
	setTimeout(debuggy, random(100, 500))
}

function addVideo(qid, videodata) {
	video = templates.video.contents().clone(true)
	let img = video.find("img")
	video.find(".video-title").html(videodata.title)
	var formatString
	$(videodata.formats).each(function () {
		if (this.format_id == qid) {
			formatString = this.format
			return false
		}
	})
	video.find(".video-format").html(formatString)
	video.attr("id", videodata.webpage_url)
	video.data("videoname", videodata.title)
	video.attr("downloadedonce", false)
	video.attr("done", false)
	video.attr("downpercent", 0)
	data.logs[videodata.webpage_url] = "[URL] "+videodata.webpage_url+"\n"
	els.videolist.append(video)
	img.prop("src", videodata.thumbnail)
}

function formatURL(e) {
	let regex = e.value.match(/(\w+:\/\/)(www\.)?(.+)/)
	if (regex) {
		e.value = regex[3]
		els.videoUrl.find("[name=protocol]").html(regex[1])
	} else {
		let regex = e.value.match(/^([\w-]{6,})$/)
		if (regex) {
			e.value = "youtube.com/watch?v=" + regex[1]
		}
	}
}

function getDataButton() {
	$(".progress[name=nav]").addClass("show")
	setProgress("nav", 0)
	setTimeout(function () {
		setProgress("nav", 20)
	}, 0);
	const data = formObject(els.videoUrl)
	els.videoUrl.find(":input").prop("disabled", true)
	let error = ""
	const url = els.videoUrl.find("[name=protocol]").html() + data.video
	const response = ahk.getVideoData(url)
	try {
		var parsed = JSON.parse(response)
	} catch (e) {
		error = e
	}

	let regex = response.match(/\[error\] (.+)/i)
	if (regex) {
		error = regex[1]
	}

	if (error) {
		showErrorDialog("Error parsing", error)
	} else {
		openVideoModal(parsed)
	}
	setProgress("nav", 0)
	$(".progress[name=nav]").removeClass("show")
	els.videoUrl.find(":input").prop("disabled", false).val("")
}

function openVideoModal(response) {
	let modal = modals.videoquality
	modal.modal("show")
	modal.find(".modal-title").html(response.title)
	modal.find(".downto").html(JSON.parse(ahk.getConf()).downpath)
	modal.find("input[name=showhidden]").prop("checked", true)
	modal.find("input[name=audio]").prop("checked", true)
	modal.find("input[name=subtitles]").prop("checked", false)
	modal.find("span[name=views]").html(response.view_count)
	modal.find("span[name=time]").html(new Date(response.duration * 1000).toISOString().substr(11, 8))
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
			option.innerHTML = (option.isAudio ? "Audio" : format.format_note)
			els.qualitySelect.append(option)
		}
		formats[format.format_note].push({ext: format.ext, id:format.format_id, data: format.tbr})
	})
	response.formats = formats
	$(response.thumbnails).reverse().each(function () {
		if (this.url.includes(".webp")) return //for ie shit
		var req = new XMLHttpRequest()
		req.open("GET", this.url, false)
		req.send()
		if (req.status !== 200) return
		this.url = this.url.replace(/\?sqp=.*/, "") // Remove youtube tracking get param because it breaks IE ufxcking
		response.thumbnail = this.url
		return false
	})
	gui.log(response.thumbnail)
	image.prop("src", response.thumbnail)
	image.parent().removeClass("loader")
	data.currentVideo = response
	updateQuality()
}

function updateQuality() {
	const qualityNote = els.qualitySelect.val()
	els.formatSelect.empty()
	$(data.currentVideo.formats[qualityNote]).each(function () {
		let option = document.createElement("option")
		option.value = this.id
		option.innerHTML = this.ext +" "+ Math.floor(this.data) +"kbps"
		els.formatSelect.append(option)
	})
}

function openSettingsModal() {
	modals.settings.modal("show")
	setDataToForm(modals.settings, JSON.parse(ahk.getConf()))
}

function settingsSave() {
	modals.settings.modal("hide")
	let data = formObject(modals.settings)
	ahk.setConf(JSON.stringify(data))
}

function downloadVideo() {
	modals.videoquality.modal("hide")
	let formdata = formObject(document.forms["videoDownload"])
	addVideo(formdata.extension, data.currentVideo)
	const select = els.qualitySelect[0]
	let qualityOption = select.options[select.selectedIndex]
	var format = formdata.format
	if (!qualityOption.isAudio && formdata.audio) format += "+bestaudio"
	data.queue.push({ form: JSON.stringify(formdata), format: format, url: data.currentVideo.webpage_url})
	checkQueue()
}

function checkQueue(ready) {
	setTimeout(function () {
		if (ready) data.queueReady = true
		if (!data.queueReady) return
		let video = data.queue.pop()
		if (typeof video !== "object") return
		ahk.downloadVideo(video.form, video.format, video.url)
		data.queueReady = false
	}, 0)
}

function setProgress(name, value) {
	let progress
	if (typeof name == "object") {
		progress = $(name)
	} else {
		progress = $(".progress[name=" + name + "] .progress-bar")
	}
	if (value == 0) progress.addClass("notransition")
	progress.css("width", value + "%")
	setTimeout(function() {
		progress.removeClass("notransition")
	}, 1000)
}

function updateProgress(url, percent, speed, size, eta) {
	els.videolist.find(".video[id=\""+url+"\"][done=false]").each(function () {
		if (isNaN(percent)) {
			data.logs[url] += "[COMMAND] "+percent+"\n"
			return
		}
		var video = $(this)
		let finished = false
		let msgprogress = percent + "% " + speed
		let msg = "Downloading"
		let progressbar = video.find(".progress-bar")

		if (percent == "100") {
			video.attr("downloadedonce", true)
		}

		if (percent == "101") {
			video.attr("done", true)
			if (video.attr("downloadedonce") == "false" || video.attr("downpercent") !== "100") {
				finished = true
				msg = "Error see logs"
				msgprogress = "Error"
				progressbar.addClass("error")
				percent = 100
			} else {
				msg = "Downloaded"
				msgprogress = "100%"
				finished = true
				checkQueue(true)
			}
		}


		percent = (percent > 100 ? 100 : percent)
		setProgress(progressbar, percent)
		video.find(".text-info").html(msg)
		video.find(".text-progress").html(msgprogress)
		if (!finished) {
			if (video.attr("downpercent") > percent) {
				setProgress(progressbar, 0)
			}
			video.attr("downpercent", percent)
			if (!video.find(".video-size").html()) {
				video.find(".video-size").html(size)
			}
		}
		return
	})
}


function videoAction(e, action) {
	e = $(e).closest(".video")
	let url = e.attr("id")
	switch (action) {
		case "delet":
			if (e.attr("done") == "true")
			e.remove()
			break
		case "logs":
			modals.console.modal("show")
			els.videolist.attr("logsactive", url)
			modals.console.find(".modal-title").html(e.data("videoname"))
			modals.console.find(".console code").html(data.logs[url])
	}
}

function setLogs() {
	els.videolist.attr("logsactive", 0)
}

function log(url, text) {
	data.logs[url] += text
	let textarea = modals.console.find(".console code")[0]
	if (els.videolist.attr("logsactive") == url) {
		textarea.innerHTML = data.logs[url]
		textarea.scrollTop = textarea.scrollHeight
	}
}

function setConfValue(e, value) {
	if (value !== "") e.parentElement.querySelector("input").value = value
}

function isJson(str) {
	try {
		JSON.parse(str)
	} catch (e) {
		return false
	}
	return true
}

function showErrorDialog(title, text) {
	let modal = modals.error
	modal.modal("show")
	modal.find(".modal-title").html(title)
	modal.find(".console code").html(text)
}

function checkClose() {
	let hasUnDoneVideos = false
	els.videolist.find(".video").each(function() {
		if (this.getAttribute("done") == "false") {
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