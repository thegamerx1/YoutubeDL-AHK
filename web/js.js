function ready() {
	videoModal = $("#videomodal")
	videoModalChoose = $("#videochoosemodal")
	settingsModal = $("#settingsModal")
	logModal = $("#logsModal")
	videolist = $("#videolist")

	videoModal.on("shown.bs.modal", function () {
		videoModal.find('input[name="video"]').focus()
	})
	videoModal.on("hidden.bs.modal", function () {
		setProgress("getData", 0)
	})
	logs = {}
	logsActive = ""
}

function debug() {
	currentVideo = { title: "helloworld", formats: [{ format: "heybro" }], thumbnail: "https://i.ytimg.com/vi/lakBQBoEVGM/maxresdefault.jpg", id: "asdasd" }
	addVideo(0)
}

function addVideo(qid) {
	let video = $("#placeholders .video").clone(true)[0]
	video.querySelector("img").src = currentVideo.thumbnail
	video.querySelector(".card-title").innerHTML = currentVideo.title
	let formatString
	currentVideo.formats.forEach(function(format) {
		if (format.format_id == qid) {
			formatString = format.format
		}
	})
	video.querySelector(".card-text").innerHTML = formatString
	video.setAttribute("videoID", currentVideo.id)
	video.setAttribute("videoname", currentVideo.title)
	videolist.append(video)
}

function checkUrl(e) {
	let regex = e.value.match(/https:\/\/(www\.)?(.+)/)
	if (regex) {
		e.value = regex[2]
	}
}

function openVideoModal() {
	if (ahk.checkConf()) return
	setProgress("getData", 0)
	videoModal.modal("show")
}
function openVideoDownloadModal(response) {
	videoModalChoose.modal("show")
	currentVideo = response
	if (response || isDebug) {
		videoModalChoose.find(".modal-title")[0].innerHTML = response.title
		videoModalChoose.find(".downto")[0].innerHTML = JSON.parse(ahk.getConf()).path
		videoModalChoose.find("input[name=showhidden]")[0].checked = true
		videoModalChoose.find("input[name=audio]")[0].checked = true

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
	let config = JSON.parse(ahk.getConf())
	for (let property in config) {
		settingsModal.find("input[name=" + property + "]")[0].value = config[property]
	}
}

function settingsSave() {
	settingsModal.modal("hide")
	let data = formString(document.forms["settingsForm"])
	ahk.setConf(JSON.stringify(data))
}

function chooseVideo() {
	let data = formString(document.forms["videoSelect"])
	let response = ahk.getVideoData("https://" + data.video)
	videoModal.modal("hide")
	if (!response) {
		return
	}
	openVideoDownloadModal(JSON.parse(response))
}

function downloadVideo() {
	videoModalChoose.modal("hide")
	let data = formString(document.forms["videoDownload"])
	addVideo(data.quality)
	setTimeout(function() {ahk.downloadVideo(data.quality, data.audio)}, 100)
}

function setProgress(name, value) {
	let progress = $(".progress[name=" + name + "] .progress-bar")[0]
	progress.style.width = value + "%"
}

function updateProgress(id, percent, eta, speed, size) {
	videolist.children().each(function() {
		if (this.getAttribute("videoID") == id) {
			let msg = size + " at " + speed
			let progressbar = this.querySelector(".progress-bar")
			if (percent == "100") {
				msg = "Downloaded"
				progressbar.style.display = "none"
			}

			progressbar.style.width = percent + "%"
			this.querySelector(".card-text").innerHTML = msg
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
			logModal.find(".console")[0].innerHTML = logs[videoID]
	}
}

function setLogs() {
	logsActive = false
}

function log(id, text) {
	if (typeof logs[id] == "undefined") {
		logs[id] = ""
	}
	logs[id] += text
	let textarea = logModal.find(".console")[0]
	if (logsActive = id) {
		textarea.innerHTML = logs[id]
		textarea.scrollTop = textarea.scrollHeight
	}
}