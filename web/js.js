function ready() {
	modals = {
		videoquality: $("#videoqualitymodal"),
		settings: $("#settingsModal"),
		console: $("#consoleModal"),
		confirmClose: $("#confirmClose"),
		error: $("#errorModal")
	}
	els = {}
	els.videoUrl = $("#videoUrl")
	els.videolist = $("#videolist")
	els.logs = {}

	$("form").submit(false)
	removeLoader()
}

function debug() {
	modals.confirmClose.modal("show")
	let currentVideo = {
		title: "LOREM LOREM LOREM LOREM LOREM LOREM LOREM",
		formats: [{ format_id: 0, format: "202 - 720p60" }],
		thumbnails: [{ "width": 168, "height": 94, "url": "https://i.ytimg.com/vi/n-a_jpyhpG0/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAQ==&rs=AOn4CLChfBR9ioRweadFcbHhrxZkw", "id": "0", "resolution": "168x94" }, { "width": 196, "height": 110, "url": "https://i.ytimg.com/vi/n-a_jpyhpG0/hqdefault.jpg?sqp=-oaymwEYCMQBEG5IVfKriqkDCwgBFQAAiEIYAXAB&rs=AOn4CLAZra0w3qtahDjWblwUP8J1ugyW3Q", "id": "1", "resolution": "196x110" }, { "width": 246, "height": 138, "url": "https://i.ytimg.com/vi/n-a_jpyhpG0/hqdefault.jpg?sqp=-oaymwEZCPYBEIoBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLDd70CWeOEJQTSUOFtS27vjpVrRVg", "id": "2", "resolution": "246x138" }, { "width": 336, "height": 188, "url": "https://i.ytimg.com/vi/n-a_jpyhpG0/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARU6BR9ioRweadFcbHhrxZkw", "id": "3", "resolution": "336x188" }],
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
	let video = $("template[name=video]").contents().clone(true)
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
	els.logs[videodata.webpage_url] = "[URL] "+videodata.webpage_url+"\n"
	els.videolist.append(video)
	let thumbnail
	$(videodata.thumbnails).reverse().each(function () {
		if (this.url.includes(".webp")) return //for ie shit
		var req = new XMLHttpRequest()
		req.open("GET", this.url, false)
		req.send()
		if (req.status !== 200) return
		this.url = this.url.replace(/\?sqp=.*/, "") // Remove youtube tracking get param because it breaks IE ufxcking
		thumbnail = this.url
		return false
	})
	img.prop("src", thumbnail)
}

function formatURL(e) {
	let regex = e.value.match(/https:\/\/(www\.)?(.+)/)
	if (regex) {
		e.value = regex[2]
	}
}

function getDataButton() {
	$(".progress[name=nav]").addClass("show")
	setProgress("nav", 0)
	setTimeout(function () {
		setProgress("nav", 20)
	}, 10);
	let data = formString(els.videoUrl)
	els.videoUrl.find(":input").prop("disabled", true)
	let response = ahk.getVideoData("https://" + data.video)
	let parsed
	let error = false
	try {
		parsed = JSON.parse(response)
	} catch (e) {
		error = true
		showErrorDialog("Error parsing", response)
	}
	if (!error) openVideoModal(parsed)
	setProgress("nav", 0)
	$(".progress[name=nav]").removeClass("show")
	els.videoUrl.find(":input").prop("disabled", false).val("")
}

function openVideoModal(response) {
	var modal = modals.videoquality
	modal.modal("show")
	modal.find(".modal-title").html(response.title)
	modal.find(".downto").html(JSON.parse(ahk.getConf()).downpath)
	modal.find("input[name=showhidden]").prop("checked", true)
	modal.find("input[name=audio]").prop("checked", true)
	modal.find("input[name=subtitles]").prop("checked", false)

	let quality = modal.find("select[name=quality]")
	quality.empty()

	let checkedOnes = []
	response.formats.forEach(function (format) {
		let option = document.createElement("option")
		option.value = format.format_id
		option.innerHTML = format.format + " " + format.ext
		if (checkedOnes.includes(format.format_note)) {
			option.classList.add("repeated")
		} else {
			checkedOnes.push(format.format_note)
		}
		quality[0].appendChild(option)
	})
	els.currentVideo = response
	toggleHidden(1)
}

function openSettingsModal() {
	modals.settings.modal("show")
	setDataToForm(modals.settings, JSON.parse(ahk.getConf()))
}

function settingsSave() {
	modals.settings.modal("hide")
	let data = formString(modals.settings)
	ahk.setConf(JSON.stringify(data))
}

function downloadVideo() {
	modals.videoquality.modal("hide")
	let data = formString(document.forms["videoDownload"])
	addVideo(data.quality, els.currentVideo)
	setTimeout(function () {
		ahk.downloadVideo(JSON.stringify(data), els.currentVideo.webpage_url)
		els.currentVideo = false
	}, 0);
}

function setProgress(name, value) {
	$(".progress[name="+name+"] .progress-bar").css("width", value + "%")
}

function updateProgress(url, percent, speed, size, eta) {
	els.videolist.find(".video[id=\""+url+"\"][done=false]").each(function () {
		if (isNaN(percent)) {
			els.logs[url] += "[COMMAND] "+percent+"\n"
			return
		}
		var video = $(this)
		let finished = false
		let msgprogress = percent + "% " + speed
		let msg = "Downloading"
		let progressbar = video.find(".progress-bar")

		if (progressbar.hasClass("notransition")) progressbar.removeClass("notransition")

		if (video.attr("downloadedonce") == "true") {
			msg = "Downloading audio"
		}

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
			}
		}


		percent = (percent > 100 ? 100 : percent)
		progressbar.css("width", percent + "%")
		video.find(".text-info").html(msg)
		video.find(".text-progress").html(msgprogress)
		if (!finished) {
			if (video.attr("downpercent") > percent) {
				progressbar.addClass("notransition")
				progressbar.css("width", "0%")
			}
			video.attr("downpercent", percent)
			if (!video.find(".video-size").html()) {
				video.find(".video-size").html(size)
			}
		}
		return
	})
}

function toggleHidden(hidden) {
	let select = modals.videoquality.find("select[name=quality]")
	if (hidden) {
		els.hiddenOpts = []
		select.children().each(function () {
			if (this.classList.contains("repeated")) {
				els.hiddenOpts.push($(this).detach())
			}
		})
	} else {
		els.hiddenOpts.forEach(function (option) {
			option.appendTo(select)
		})
		els.hiddenOpts = []
	}
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
			modals.console.find(".console code").html(els.logs[url])
	}
}

function setLogs() {
	els.videolist.attr("logsactive", 0)
}

function log(url, text) {
	els.logs[url] += text
	let textarea = modals.console.find(".console code")[0]
	if (els.videolist.attr("logsactive") == url) {
		textarea.innerHTML = els.logs[url]
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
		return true
	} else {
		return false
	}
}

function EXIT() {
	gui.close("force")
}