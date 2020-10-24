class MyGui extends EzGui {
	init() {
		conf := this.conf
		conf.autosize := true
		conf.title := "Youtube Downloader"
		conf.options := "-MinimizeBox -MaximizeBox"
	}

	buildGui() {
		controls := this.controls
		Gui Font, s12 q5 cCFCFCF
		Gui, Add, Edit, w390 +hwndEditDownload, https://www.youtube.com/watch?v=x7Xzvm0iLCI
		controls.EditDownload := EditDownload
		this.resetFont()
		Gui, Add, Button, w100 h30 +hwndbtnDownload yp x+10, Download Video
		controls.btnDownload := btnDownload
		Gui, Add, Button, w100 h30 x410 x410 +hwndbtnSettings, Settings
		controls.btnSettings := btnSettings


		Gui, Add, ListView, w500 h300 xm +hwndListView, Name|Status|Quality|Size|Lenght
		this.controls.ListView := ListView
		DownloadGui.create("NoShow owner=" this.controls.hGui, this)
		SettingsGui.create("NoShow owner=" this.controls.hGui, this)
	}

	class EventHook extends EzGuiHook {
		init() {
			if !(configFile.data.defaultquality) {
				configFile.data.defaultquality := "1080p"
			}
			if !(configFile.data.defaultfolder) {
				configFile.data.defaultfolder := A_Desktop
			}
			if !(configFile.data.autodownload) {
				configFile.data.autodownload := False
			}
			configFile.save()
			this.timerloopey := new timer(this.refresh.bind(this), 500)
		}

		events() {
			controls := this.controls
			this.event.Add(controls.btnDownload, "btnDownload")
			this.event.Add(controls.btnSettings, "btnSettings")
		}

		btnSettings() {
			SettingsGui.open()
		}

		btnDownload() {
			GuiControlGet, video,, % this.controls.EditDownload
			if !(RegExMatch(video, "O)(youtube|youtu)\.\w+\/(watch\?v\=)?(?<id>\w+)", match)) {
				Msgbox, 8240, Error, Error video not valid
				btnDownload()
				return
			}

			Progress B CW818181 CTDFDDDD, Getting data
			Progress, 30
			videotemp := RunOutput("youtube-dl.exe --get-title --get-duration " video)
			videotemp := StrSplit(videotemp, "`n")
			videodata := {title: videotemp[1], duration: videotemp[2], id: match.id, link: video}
			Progress, 95
			options := RunOutput("youtube-dl.exe -F " video)
			Progress, 100
			videooptions := {}
			regex := "(?<code>\d+)\s+(?<extension>mp4)\s+(?<res>\d+x\d+)\s+(?<quality>\d+p)\s+(?<bitrate>\d+k)\s,\s(?<codec>.*),\s(?<fps>\d+fps),\s(?<video>(video only|[\w|\d|\.|@|\(|\)| ]+))(,\s(?<size>[\w|\.]+))?"
			if (RegExMatch(options, "O)" regex, match) && videotemp[2]) {
				options := match.value
			} else {
				Msgbox, 8240, Error, Error getting video data
				btnDownload()
				Progress off
				return
			}
			options := StrSplit(match.value, "`n")
			for key, value in options {
				RegExMatch(value, "O)" regex, match)
				videooptions[match.code] := {extension: match.extension, res: match.res, quality: match.quality, bitrate: match.bitrate, fps: match.fps, video: match.video, size: match.size}
			}
			Progress Off
			if (configFile.data.autodownload) {
				for key, value in videooptions {
					if (value.quality = configFile.data.defaultquality) {
						this.Download(value.quality " " value.fps " " value.size  " " value.res " " value.extension, videodata)
						break
					}
				}
			} else {
				DownloadGui.open(videodata, videooptions)
			}
		}

		refresh() {
			for key, value in this.videos {
				if (value.status = "Completed")
					continue

				file := value.file "\" value.data.title "." value.quality[5]
				if (FileExist(file)) {
					this.parent.focus()
					LV_Modify(ListBoxGetRow(value.data.title), "Col2", "Completed")
					value.status := "Completed"
				}
			}
		}

		Download(quality, data) {
			quality := StrSplit(quality, " ")
			if (configFile.data.autodownload) {
				file := configFile.data.defaultfolder
			} else {
				FileSelectFolder, file, ::{20d04fe0-3aea-1069-a2d8-08002b30309d}, Save video
			}
			if (!file)
				return
			this.parent.visible := true

			resh := StrSplit(quality[4], "x")
			fps := RegExReplace(quality[2], "[A-Za-z]")
			size := RegExReplace(quality[3], "[A-Za-z]")
			command := "youtube-dl.exe --merge-output-format mp4 --no-cache-dir -o " file "\%(title)s.%(ext)s -f bestvideo[width=" resh[1] "][height=" resh[2] "][ext=" quality[5] "][fps=" fps "]+bestaudio " data.link
			debug.print(command)
			Run, %command%,, Hide
			this.videos[data.title] := {status: "0%", data: data, file: file, quality: quality, size: size}
			this.parent.focus()
			LV_Add(, data.title, "Downloading", quality[1], quality[3], data.duration)
			LV_ModifyCol(1, "AutoHdr")
			LV_ModifyCol(2, "AutoHdr")
			LV_ModifyCol(3, "AutoHdr")
			LV_ModifyCol(4, "AutoHdr")
			LV_ModifyCol(5, "AutoHdr")
		}

		close() {
			ExitApp, 0
		}
	}
}


class DownloadGui extends EzGui {
	init() {
		conf := this.conf
		conf.autosize := true
		conf.title := "Download"
		conf.options := "-SysMenu"
	}

	buildGui() {
		controls := this.controls
		Gui Font, s11 q5 cCFCFCF
		Gui, Add, Text, w290 +hwndTextTitle, Title
		controls.TextTitle := TextTitle
		this.resetFont()

		Gui, Add, DropDownList, w290 h30 hwndComboBoxie r8
		controls.ComboBoxie := ComboBoxie

		Gui, Add, Button, w100 h30 x100 +hwndbtnDownload, Download Video
		controls.btnDownload := btnDownload

		controls.Progress := Progress
	}

	open(data, options) {
		this.data := data
		controls := this.controls
		Gui % this.controls.parent.controls.hGui ": +Disabled"
		this.visible := True
		GuiControl,, % controls.TextTitle, % data.title

		GuiControl,, % controls.ComboBoxie, |
		for key, value in options {
			GuiControl,, % controls.ComboBoxie, % value.quality " " value.fps " " value.size  " " value.res " " value.extension "|"
		}
		GuiControl, Choose, % controls.ComboBoxie, 1
	}

	class EventHook extends EzGuiHook {
		events() {
			controls := this.controls
			this.event.Add(controls.btnDownload, "btnDownload")
		}

		btnDownload() {
			controls := this.controls
			GuiControlGet, video,, % controls.ComboBoxie
			this.parent.visible := false
			Gui % controls.parent.controls.hGui ": -Disabled"
			controls.parent.visible := true
			controls.parent.EventHook.Download(video, this.parent.data)
		}

		close() {
			return 1
		}
	}
}

class SettingsGui extends EzGui {
	init() {
		conf := this.conf
		conf.autosize := true
		conf.title := "Settings"
		conf.options := "-SysMenu"
	}

	buildGui() {
		controls := this.controls
		Gui, Add, Text,, Default Folder:
		Gui, Add, Text, c476ead yp w290 x+10 +hwndTextDefaultFolder
		controls.TextDefaultFolder := TextDefaultFolder

		Gui, Add, Text, xm, Default quality:
		Gui, add, DropDownList, yp w200 r6 hwndComboQuality x+10, 240p|360p|480p|720p|1080p|1440p|2160p
		controls.ComboQuality := ComboQuality

		Gui, Add, checkbox, hwndCheckDownload, Auto Download on quality match
		controls.CheckDownload := CheckDownload

		Gui, Add, Button, w100 h30 x145 +hwndButtonSave, Save
		controls.ButtonSave := ButtonSave
	}

	open() {
		Gui % this.controls.parent.controls.hGui ": +Disabled"
		this.visible := true
	}

	class EventHook extends EzGuiHook {
		init() {
			controls := this.controls
			if (configFile.data.autodownload)
				GuiControl,, % controls.CheckDownload, 1

			GuiControl,, % controls.TextDefaultFolder, % configFile.data.defaultfolder
			GuiControl, ChooseString, % controls.ComboQuality, % configFile.data.defaultquality
			this.updateBtn()
		}

		updateBtn() {
			GuiControl, Move, % this.controls.ButtonChoose, x+10
		}

		events() {
			controls := this.controls
			this.event.Add(controls.ButtonSave, "ButtonSave")
			this.event.Add(controls.TextDefaultFolder, "TextDefaultFolder")
			this.event.Add(controls.ButtonSave, "ButtonSave")
		}

		TextDefaultFolder() {
			FileSelectFolder, file, ::{20d04fe0-3aea-1069-a2d8-08002b30309d}, Default folder
			if (!file)
				return

			GuiControl,, % this.controls.TextDefaultFolder, %file%
			this.updateBtn()
		}

		ButtonSave() {
			controls := this.controls
			this.parent.visible := false
			Gui % controls.parent.controls.hGui ": -Disabled"
			controls.parent.visible := true

			GuiControlGet, quality,, % controls.ComboQuality
			configFile.data.defaultquality := quality

			GuiControlGet, check,, % controls.CheckDownload
			configFile.data.autodownload := check

			GuiControlGet, defaultfolder,, % controls.TextDefaultFolder
			configFile.data.defaultfolder := defaultfolder

			configFile.save()
		}

		close() {
			return 1
		}
	}
}