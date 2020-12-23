function ready() {
	videoModal = $("#videomodal")
	videoModalChoose = $("#videochoosemodal")
	settingsModal = $("#settingsModal")
	logModal = $("#logsModal")
	errModal = $("#errModal")
	videolist = $("#videolist")

	videoModal.on("shown.bs.modal", function () {
		videoModal.find('input[name="video"]').focus()
	})
	videoModal.on("hidden.bs.modal", function () {
		setProgress("getData", 0)
	})
	logs = {}
	logsActive = ""
	$('form').submit(false)
}

function debug() {
	currentVideo = { title: "LOREM LOREM LOREM LOREM LOREM LOREM LOREM", formats: [{ format_id: 0, format: "202 - 720p60" }], thumbnails: [{ url: "https://i.ytimg.com/" }, { url: "https://i.ytimg.com/vi/AqyDMGR7XsU/hqdefault.jpg?sqp=-oaymwEZCPYBEIoBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLD6iknbQNwSjpIPOCscpbqypbUE7g"}], id: "asdasd"}
	addVideo(0)
	debugg = {}
	debugg.downpercent = 0
	debugg.downloops = 0
	debugg.nextpercent = false
	debugg.sentOnce = true
	debugg.firstRun = true
	debuggy()
}

// ? Simulate download in browser for developing epic progressbar yes
function debuggy() {
	if (debugg.firstRun) {
		debugg.firstRun = false
		updateProgress("asdasd", "sasdasadsadasdasdsasdasadsadasdasdsasdasadsadasdasdsasdasadsadasdasdsasdasadsadasdasdsasdasadsadasdasdsasdasadsadasdasd")
	}
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
	updateProgress("asdasd", debugg.downpercent, random(1, 50) + "MB/s", "123MiB", random(10, 59) + ":" + random(10, 59))
	console.log(debugg.downpercent)
	if (debugg.downpercent == 101) return
	if (debugg.downpercent == 100) {
		debugg.nextpercent = true
		debugg.downloops++
		debugg.downpercent = 0
	}
	setTimeout(debuggy, random(10, 100))
}

function addVideo(qid) {
	let video = $("#placeholders .video").clone(true)[0]
	var thumbnail
	currentVideo.thumbnails.forEach(function (thumb) {
		if (!thumb.url.includes(".webp")) {
			thumbnail = thumb.url
		}
	})

	video.querySelector("img").src = thumbnail
	video.querySelector(".video-title").innerHTML = currentVideo.title
	var formatString
	currentVideo.formats.forEach(function (format) {
		if (format.format_id == qid) {
			formatString = format.format
		}
	})
	video.querySelector(".video-format").innerHTML = formatString
	video.setAttribute("videoID", currentVideo.id)
	video.setAttribute("videoname", currentVideo.title)
	video.setAttribute("downloadedonce", false)
	video.setAttribute("done", false)
	video.setAttribute("downpercent", 0)
	logs[currentVideo.id] = "[URL] "+ currentVideo.webpage_url
	videolist.append(video)
}

function checkUrl(e) {
	let regex = e.value.match(/https:\/\/(www\.)?(.+)/)
	if (regex) {
		e.value = regex[2]
	}
}

function openVideoModal() {
	videoModal.modal("show")
	setProgress("getData", 0)
	videoModal.find("input[name=video]")[0].value = ""
	videoModal.find("button").prop("disabled", 0)
}
function openVideoDownloadModal(response) {
	videoModalChoose.modal("show")
	currentVideo = response
	if (response) {
		videoModalChoose.find(".modal-title")[0].innerHTML = response.title
		videoModalChoose.find(".downto")[0].innerHTML = JSON.parse(ahk.getConf()).downpath
		videoModalChoose.find("input[name=showhidden]")[0].checked = true
		videoModalChoose.find("input[name=audio]")[0].checked = true
		videoModalChoose.find("input[name=subtitles]")[0].checked = false

		let quality = videoModalChoose.find("select[name=quality]")[0]
		quality.innerHTML = ""

		let checkedOnes = []

		response.formats.forEach(function(format) {
			let option = document.createElement("option")
			option.value = format.format_id
			option.innerHTML = format.format + " " + format.ext
			if (checkedOnes.includes(format.format_note)) {
				option.classList.add("repeated")
			} else {
				checkedOnes.push(format.format_note)
			}
			quality.appendChild(option)
		});
		toggleHidden(1)
	}
}

function openSettingsModal() {
	settingsModal.modal("show")
	setDataToForm(settingsModal, JSON.parse(ahk.getConf()))
}

function settingsSave() {
	settingsModal.modal("hide")
	let data = formString(document.forms["settingsForm"])
	ahk.setConf(JSON.stringify(data))
}

function chooseVideo() {
	videoModal.find("button").prop("disabled", true)
	let data = formString(document.forms["videoSelect"])
	let response = ahk.getVideoData("https://" + data.video)
	videoModal.modal("hide")
	let parsed
	try {
		parsed = JSON.parse(response)
	} catch (e) {
		return
	}
	openVideoDownloadModal(parsed)
}

function downloadVideo() {
	videoModalChoose.modal("hide")
	let data = formString(document.forms["videoDownload"])
	setTimeout(function() {
		ahk.downloadVideo(JSON.stringify(data))
	}, 0);
	addVideo(data.quality)
}

function setProgress(name, value) {
	let progress = $(".progress[name=" + name + "] .progress-bar")[0]
	progress.style.width = value + "%"
}

function updateProgress(id, percent, speed, size, eta) {
	videolist.find(".video[videoID="+ id +"][done=false]").each(function() {
		if (this.getAttribute("videoID") == id && this.getAttribute("done") == "false") {
			if (isNaN(percent)) {
				logs[id] += "\n[COMMAND] "+ percent +"\n"
				return
			}
			let finished = false
			let msgprogress = percent +"% "+ speed
			let msg = "Downloading"
			let progressbar = this.querySelector(".progress-bar")

			if (progressbar.classList.contains("notransition")) progressbar.classList.remove("notransition")

			if (this.getAttribute("downloadedonce") == "true") {
				msg = "Downloading audio"
			}

			if (percent == "100") {
				this.setAttribute("downloadedonce", true)
				// msgprogress = speed
			}


			if (percent == "101") {
				this.setAttribute("done", true)
				if (this.getAttribute("downloadedonce") == "false"
				||	this.getAttribute("downpercent") !== "100"
				) {
					finished = true
					msg = "Error see logs"
					msgprogress = "Error"
					progressbar.classList.add("error")
					percent = 100
				} else {
					msg = "Downloaded"
					msgprogress = "100%"
					finished = true
				}
			}


			percent = (percent > 100 ? 100 : percent)
			progressbar.style.width = percent + "%"
			this.querySelector(".text-info").innerHTML = msg
			this.querySelector(".text-progress").innerHTML = msgprogress
			if (!finished) {
				if (this.getAttribute("downpercent") > percent) {
					progressbar.classList.add("notransition")
					progressbar.style.width = "0%"
				}
				this.setAttribute("downpercent", percent)
				if (!this.querySelector(".video-size").innerHTML) {
					this.querySelector(".video-size").innerHTML = size
				}
			}
			return
		}
	})
}

function toggleHidden(hidden) {
	let select = videoModalChoose.find("select[name=quality]")
	if (hidden) {
		hiddenOpts = []
		select.children().each(function () {
			if (this.classList.contains("repeated")) {
				hiddenOpts.push($(this).detach())
			}
		})
	} else {
		hiddenOpts.forEach(function(option) {
			option.appendTo(select)
		})
		hiddenOpts = []
	}
}

function videoAction(e, action) {
	e = $(e).closest(".video")[0]
	let videoID = e.getAttribute("videoID")
	switch (action) {
		case "delet":
			$(e).remove()
			break
		case "logs":
			logModal.modal("show")
			logsActive = videoID
			logModal.find(".modal-title")[0].innerHTML = e.getAttribute("videoname")
			logModal.find(".console code")[0].innerHTML = logs[videoID]
	}
}

function setLogs() {
	logsActive = false
}

function log(id, text) {
	logs[id] += text
	let textarea = logModal.find(".console code")[0]
	if (logsActive = id) {
		textarea.innerHTML = logs[id]
		textarea.scrollTop = textarea.scrollHeight
	}
}

function setConfValue(e, value) {
	if (value !== "")
		e.parentElement.querySelector("input").value = value
}

function isJson(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

function showErrorDialog(title, text) {
	errModal.modal("show")
	errModal.find(".modal-title")[0].innerHTML = title
	errModal.find(".console code")[0].innerHTML = text
}