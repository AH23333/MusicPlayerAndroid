import storageAdapter from "./storageAdapter.js"

// 辅助函数：安全获取 Capacitor 插件
async function getCapacitorPlugins() {
  if (window.Capacitor && window.Capacitor.Plugins) {
    return window.Capacitor.Plugins
  }
  // 等待 Capacitor 初始化
  return new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        resolve(window.Capacitor.Plugins)
      )
    } else {
      resolve(window.Capacitor.Plugins)
    }
  })
}

// 辅助函数：请求存储权限
async function requestStoragePermissions() {
  try {
    const plugins = await getCapacitorPlugins()
    if (!plugins || !plugins.Permissions) return true // 非 Capacitor 环境直接通过
    const { Permissions } = plugins

    // 首先检查权限状态
    let statusResult
    try {
      statusResult = await Permissions.checkPermissions({
        permissions: [
          "android.permission.READ_EXTERNAL_STORAGE",
          "android.permission.WRITE_EXTERNAL_STORAGE",
        ],
      })

      // 如果已经有权限，直接返回 true
      if (statusResult.granted) {
        return true
      }
    } catch (statusError) {
      console.warn("检查权限状态失败", statusError)
    }

    // 请求权限
    const result = await Permissions.requestPermissions({
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    })
    return result.granted
  } catch (error) {
    console.warn("权限请求失败", error)
    return false
  }
}

// 封装 API 调用
class ApiService {
  // 搜索音乐
  async searchMusic(keyword, offset = 0) {
    try {
      // 构建搜索 URL
      const searchUrl = `https://163api.qijieya.cn/cloudsearch?keywords=${encodeURIComponent(keyword)}&offset=${offset}&limit=20`

      // 使用 fetch 进行网络请求
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://music.163.com/",
          Origin: "https://music.163.com/",
        },
      })

      if (!response.ok) {
        // 如果直接请求失败，尝试使用 CORS 代理
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`
        const proxyResponse = await fetch(proxyUrl)

        if (!proxyResponse.ok) {
          throw new Error(`搜索失败，状态码：${proxyResponse.status}`)
        }

        return await proxyResponse.json()
      }

      return await response.json()
    } catch (error) {
      console.error("搜索音乐失败:", error)
      return { result: { songs: [] } }
    }
  }

  // 保存播放列表
  async savePlaylist(playlist) {
    return await storageAdapter.set("PlayList", playlist)
  }

  // 读取播放列表
  async readPlaylist() {
    return await storageAdapter.get("PlayList", [])
  }

  // 获取歌词
  async fetchLyrics(songId) {
    console.log("[歌词] 开始获取，歌曲ID:", songId)
    if (!songId) {
      console.error("[歌词] 歌曲ID无效")
      return null
    }
    try {
      const lyricUrl = `https://api.qijieya.cn/meting/?server=netease&type=lrc&id=${songId}`
      console.log("[歌词] 请求URL:", lyricUrl)
      const response = await fetch(lyricUrl)
      const text = await response.text()
      console.log("[歌词] 原始响应长度:", text.length)
      console.log("[歌词] 原始响应前100字符:", text.substring(0, 100))

      // 检查是否是纯文本歌词（以 [ 开头）
      if (text.trim().startsWith("[")) {
        console.log("[歌词] 识别为纯文本LRC格式")
        return { lrc: text, tlrc: "" }
      }

      // 尝试解析为 JSON
      try {
        const json = JSON.parse(text)
        console.log("[歌词] 解析为JSON成功")
        // 处理各种可能的JSON格式
        if (typeof json === "string") {
          return { lrc: json, tlrc: "" }
        }
        if (json.lrc && json.lrc.lyric) {
          return { lrc: json.lrc.lyric, tlrc: json.tlrc?.lyric || "" }
        }
        if (json.lyric) {
          return { lrc: json.lyric, tlrc: json.tlyric || "" }
        }
        return { lrc: json.lrc || json.lyrics || "", tlrc: json.tlrc || "" }
      } catch (e) {
        // 不是JSON，直接作为歌词文本
        console.log("[歌词] 非JSON格式，直接作为歌词文本")
        return { lrc: text, tlrc: "" }
      }
    } catch (error) {
      console.error("[歌词] 获取失败:", error)
      return null
    }
  }

  // 读取我喜欢的歌曲
  async readLikedSongs() {
    return await storageAdapter.get("MyFavorite", [])
  }

  // 保存我喜欢的歌曲
  async saveLikedSongs(likedSongs) {
    return await storageAdapter.set("MyFavorite", likedSongs)
  }

  // 读取关注歌手
  async readFollowedArtists() {
    return await storageAdapter.get("FollowedArtists", [])
  }

  // 保存关注歌手
  async saveFollowedArtists(followedArtists) {
    return await storageAdapter.set("FollowedArtists", followedArtists)
  }

  // 读取自定义歌单
  async readCustomPlaylists() {
    return await storageAdapter.get("CustomPlaylists", [])
  }

  // 保存自定义歌单
  async saveCustomPlaylists(playlists) {
    return await storageAdapter.set("CustomPlaylists", playlists)
  }

  // 读取最近播放
  async readLatestPlayed() {
    return await storageAdapter.get("Latest", [])
  }

  // 保存最近播放
  async saveLatestPlayed(latestPlayed) {
    return await storageAdapter.set("Latest", latestPlayed)
  }

  // 读取自建歌单
  async readDIYPlaylists() {
    return await storageAdapter.get("DIYSongList", [])
  }

  // 保存自建歌单
  async saveDIYPlaylists(playlists) {
    return await storageAdapter.set("DIYSongList", playlists)
  }

  // 保存歌单封面
  async savePlaylistCover({ playlistId, coverData }) {
    const hasPermission = await requestStoragePermissions()
    if (!hasPermission) {
      // 权限被拒绝，使用 base64 数据作为 fallback
      return {
        success: true,
        coverData: coverData,
        message: "使用 base64 存储封面（无存储权限）",
      }
    }
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        // Capacitor 不可用，使用 base64 数据作为 fallback
        return {
          success: true,
          coverData: coverData,
          message: "使用 base64 存储封面（Capacitor 不可用）",
        }
      }
      const { Filesystem, Directory } = plugins
      const base64Data = coverData.split(",")[1] // 去掉 data:image/...;base64,
      const format = coverData.match(/^data:image\/(\w+);base64,/)[1]
      const fileName = `${playlistId}.${format}`
      const filePath = `DIYSongListPage/${fileName}`

      // 确保目录存在
      try {
        await Filesystem.mkdir({
          path: "DIYSongListPage",
          directory: "DOCUMENTS",
          recursive: true,
        })
      } catch (error) {
        // 目录已存在，忽略错误
      }

      await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: "DOCUMENTS",
      })

      // 获取完整的文件URI
      const fileUri = await Filesystem.getUri({
        path: filePath,
        directory: "DOCUMENTS",
      })

      return { success: true, coverPath: filePath, fileUri: fileUri.uri }
    } catch (error) {
      console.error("保存歌单封面失败:", error)
      // 保存失败，使用 base64 数据作为 fallback
      return {
        success: true,
        coverData: coverData,
        message: "使用 base64 存储封面（保存失败）",
      }
    }
  }

  // 导出用户信息（选择路径）
  async exportUserInfo() {
    try {
      const userData = {
        likedSongs: await this.readLikedSongs(),
        followedArtists: await this.readFollowedArtists(),
        customPlaylists: await this.readCustomPlaylists(),
        diyPlaylists: await this.readDIYPlaylists(),
        latestPlayed: await this.readLatestPlayed(),
        searchHistory: await this.readSearchHistory(),
      }
      const jsonData = JSON.stringify(userData, null, 2)
      const fileName = `User.json`

      // 尝试 Capacitor 文件写入
      if (
        window.Capacitor &&
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.Filesystem
      ) {
        try {
          // 请求存储权限
          const hasPermission = await requestStoragePermissions()
          if (!hasPermission) {
            return { success: false, message: "需要存储权限才能导出文件" }
          }

          const { Filesystem } = window.Capacitor.Plugins
          const result = await Filesystem.writeFile({
            path: fileName,
            data: jsonData,
            directory: "DOCUMENTS",
            encoding: "utf8",
          })
          // 改进导出提示
          return {
            success: true,
            message: `导出成功：文件已保存至 Documents/${fileName}，请使用文件管理器查看`,
          }
        } catch (err) {
          console.warn("Capacitor 导出失败，回退浏览器下载:", err)
          // 继续执行浏览器下载 fallback
        }
      }

      // 浏览器下载 fallback
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return { success: true, message: "导出成功（文件已下载到默认下载路径）" }
    } catch (error) {
      console.error("导出用户信息失败:", error)
      return { success: false, message: error.message }
    }
  }

  // 导入用户信息（文件选择 + FileReader）
  async importUserInfo() {
    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "application/json"
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) {
          resolve({ success: false, message: "未选择文件" })
          return
        }
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const userData = JSON.parse(event.target.result)
            console.log("导入用户信息:", userData)

            // 导入喜欢的歌曲
            if (userData.likedSongs) {
              console.log("导入喜欢的歌曲:", userData.likedSongs.length)
              await this.saveLikedSongs(userData.likedSongs)
            }

            // 导入关注的歌手
            if (userData.followedArtists) {
              console.log("导入关注的歌手:", userData.followedArtists.length)
              await this.saveFollowedArtists(userData.followedArtists)
            }

            // 导入自定义歌单
            if (userData.customPlaylists) {
              console.log("导入自定义歌单:", userData.customPlaylists.length)
              await this.saveCustomPlaylists(userData.customPlaylists)
            }

            // 导入自建歌单
            if (userData.diyPlaylists) {
              console.log("导入自建歌单:", userData.diyPlaylists.length)
              await this.saveDIYPlaylists(userData.diyPlaylists)
            }

            // 导入最近播放
            if (userData.latestPlayed) {
              console.log("导入最近播放:", userData.latestPlayed.length)
              await this.saveLatestPlayed(userData.latestPlayed)
            }

            // 导入搜索历史
            if (userData.searchHistory) {
              console.log("导入搜索历史:", userData.searchHistory.length)
              await this.saveSearchHistory(userData.searchHistory)
            }

            console.log("所有数据导入完成")
            // 不需要刷新页面，让调用方处理刷新
            resolve({ success: true, message: "导入成功" })
          } catch (error) {
            console.error("导入用户信息失败:", error)
            resolve({
              success: false,
              message: "解析文件失败: " + error.message,
            })
          }
        }
        reader.onerror = () => {
          console.error("读取文件失败")
          resolve({ success: false, message: "读取文件失败" })
        }
        reader.readAsText(file)
      }
      input.click()
    })
  }

  // 导出歌单（选择路径）
  async exportPlaylist(playlist) {
    try {
      const playlistData = {
        name: playlist.name,
        description: playlist.description,
        coverPath: playlist.coverPath,
        coverData: playlist.coverData,
        songs: playlist.songs,
      }
      const jsonData = JSON.stringify(playlistData, null, 2)
      const fileName = `${playlist.name}.json`

      // 尝试 Capacitor 文件写入
      if (
        window.Capacitor &&
        window.Capacitor.Plugins &&
        window.Capacitor.Plugins.Filesystem
      ) {
        try {
          // 请求存储权限
          const hasPermission = await requestStoragePermissions()
          if (!hasPermission) {
            return { success: false, message: "需要存储权限才能导出文件" }
          }

          const { Filesystem } = window.Capacitor.Plugins
          const result = await Filesystem.writeFile({
            path: fileName,
            data: jsonData,
            directory: "DOCUMENTS",
            encoding: "utf8",
          })
          // 改进导出提示
          return {
            success: true,
            message: `导出成功：文件已保存至 Documents/${fileName}，请使用文件管理器查看`,
          }
        } catch (err) {
          console.warn("Capacitor 导出失败，回退浏览器下载:", err)
          // 继续执行浏览器下载 fallback
        }
      }

      // 浏览器下载 fallback
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return { success: true, message: "导出成功（文件已下载到默认下载路径）" }
    } catch (error) {
      console.error("导出歌单失败:", error)
      return { success: false, message: error.message }
    }
  }

  // 导入歌单（文件选择 + FileReader）
  async importPlaylist() {
    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "application/json"
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) {
          resolve({ success: false, message: "未选择文件" })
          return
        }
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const playlistData = JSON.parse(event.target.result)
            if (!playlistData.name || !Array.isArray(playlistData.songs)) {
              resolve({ success: false, message: "无效的歌单文件" })
              return
            }
            const newPlaylist = {
              id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: playlistData.name,
              description: playlistData.description || "",
              coverPath: playlistData.coverPath || "",
              coverData: playlistData.coverData || "",
              songs: playlistData.songs || [],
            }
            const currentPlaylists = await this.readDIYPlaylists()
            currentPlaylists.push(newPlaylist)
            await this.saveDIYPlaylists(currentPlaylists)
            resolve({
              success: true,
              message: "导入成功",
              playlist: newPlaylist,
            })
          } catch (error) {
            resolve({
              success: false,
              message: "解析文件失败: " + error.message,
            })
          }
        }
        reader.onerror = () =>
          resolve({ success: false, message: "读取文件失败" })
        reader.readAsText(file)
      }
      input.click()
    })
  }

  // 读取搜索历史
  async readSearchHistory() {
    return await storageAdapter.get("SearchHistory", [])
  }

  // 保存搜索历史
  async saveSearchHistory(searchHistory) {
    return await storageAdapter.set("SearchHistory", searchHistory)
  }

  // 读取本地歌曲
  async readLocalSongs() {
    return await storageAdapter.get("LocalSongs", [])
  }

  // 导入本地歌曲
  async importLocalSongs() {
    const hasPermission = await requestStoragePermissions()
    if (!hasPermission) {
      return { success: false, message: "需要存储权限才能导入本地歌曲" }
    }
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        return {
          success: false,
          message: "Capacitor 插件不可用，无法导入本地歌曲",
        }
      }
      const { FilePicker } = plugins

      // 选择音频文件
      const result = await FilePicker.pickFiles({
        types: ["audio/*"],
        multiple: true,
      })

      if (!result || !result.files || result.files.length === 0) {
        return { success: false, message: "未选择文件" }
      }

      const files = result.files
      const newSongs = []

      // 读取现有本地歌曲
      const existingSongs = await this.readLocalSongs()
      const existingPaths = new Set(existingSongs.map((song) => song.url))

      for (const file of files) {
        // 检查是否已存在
        if (existingPaths.has(file.path)) {
          continue
        }

        // 解析文件名获取歌曲信息
        const fileName = file.name
        const nameParts = fileName.split(" - ")
        let title = fileName.replace(/\.[^/.]+$/, "")
        let artist = "未知艺术家"

        if (nameParts.length >= 2) {
          artist = nameParts[0]
          title = nameParts
            .slice(1)
            .join(" - ")
            .replace(/\.[^/.]+$/, "")
        }

        // 创建歌曲对象
        // 优先使用 uri（Capacitor 返回的完整 URI，如 content://... 或 file://...）
        let songUrl = file.uri || file.path
        // 如果既没有 uri 也没有 path，跳过
        if (!songUrl) {
          console.warn("文件缺少 uri 或 path，跳过")
          continue
        }
        // 如果 URL 已经是 content:// 或 file:// 开头，直接使用；否则添加 file:// 前缀
        if (
          !songUrl.startsWith("content://") &&
          !songUrl.startsWith("file://")
        ) {
          songUrl = `file://${songUrl}`
        }
        const newSong = {
          id: Date.now() + Math.random(),
          name: title,
          artist: artist,
          album: "本地专辑",
          url: songUrl,
          cover: "", // 暂时没有封面
          local: true,
        }

        newSongs.push(newSong)
      }

      if (newSongs.length === 0) {
        return { success: false, message: "没有新歌曲可导入" }
      }

      // 保存到本地歌曲列表
      const updatedSongs = [...existingSongs, ...newSongs]
      await this.saveLocalSongs(updatedSongs)

      return {
        success: true,
        message: `成功导入 ${newSongs.length} 首歌曲`,
        songs: newSongs,
      }
    } catch (error) {
      console.error("导入本地歌曲失败:", error)
      // 处理用户取消选择的情况
      if (error.message && error.message.includes("canceled")) {
        return { success: false, message: "操作已取消" }
      }
      return { success: false, message: "导入失败: " + error.message }
    }
  }

  // 删除本地歌曲
  async deleteLocalSong(songUrl) {
    try {
      // 读取现有本地歌曲
      const existingSongs = await this.readLocalSongs()
      // 过滤掉要删除的歌曲
      const updatedSongs = existingSongs.filter((song) => song.url !== songUrl)
      // 保存更新后的列表
      await this.saveLocalSongs(updatedSongs)
      return { success: true, message: "删除成功" }
    } catch (error) {
      console.error("删除本地歌曲失败:", error)
      return { success: false, message: "删除失败: " + error.message }
    }
  }

  // 下载歌曲
  async downloadSong(song) {
    const hasPermission = await requestStoragePermissions()
    if (!hasPermission) {
      return { success: false, message: "需要存储权限才能下载歌曲" }
    }
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        return { success: false, message: "Capacitor 插件不可用，无法下载歌曲" }
      }
      const { Filesystem, Directory, FilePicker } = plugins

      // 让用户选择保存目录
      let saveDirectory
      try {
        const folderResult = await FilePicker.pickFolders()
        if (
          !folderResult ||
          !folderResult.folders ||
          folderResult.folders.length === 0
        ) {
          return { success: false, message: "未选择保存目录" }
        }
        saveDirectory = folderResult.folders[0].path
      } catch (error) {
        // 如果选择目录失败，使用应用内部存储
        saveDirectory = "Download"
        // 确保目录存在
        await Filesystem.mkdir({
          path: saveDirectory,
          directory: "DOCUMENTS",
          recursive: true,
        })
      }

      // 获取歌曲真实播放地址
      const urlResponse = await fetch(
        `https://api.qijieya.cn/meting/?type=url&id=${song.id}`
      )
      const urlData = await urlResponse.json()
      const songUrl = urlData.url

      if (!songUrl) {
        return { success: false, message: "无法获取歌曲播放地址" }
      }

      // 下载歌曲文件
      const response = await fetch(songUrl)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const base64Data = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      )

      // 生成安全的文件名（去除特殊字符）
      const safeFileName = `${song.name.replace(/[<>"/\\|?*]/g, "")} - ${song.ar ? song.ar[0].name.replace(/[<>"/\\|?*]/g, "") : "未知艺术家"}.mp3`

      let filePath
      let writeResult
      try {
        // 尝试写入用户选择的目录
        filePath = `${saveDirectory}/${safeFileName}`
        writeResult = await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: Directory.External,
        })
      } catch (error) {
        // 如果失败，写入应用内部存储
        filePath = `${saveDirectory}/${safeFileName}`
        writeResult = await Filesystem.writeFile({
          path: filePath,
          data: base64Data,
          directory: "DOCUMENTS",
        })
      }

      // 将歌曲信息添加到本地歌曲列表
      const localSongs = await this.readLocalSongs()
      const newLocalSong = {
        id: song.id,
        name: song.name,
        artist: song.ar ? song.ar[0].name : "未知艺术家",
        album: song.al ? song.al.name : "未知专辑",
        url: writeResult.uri,
        cover: song.al ? song.al.picUrl : "",
      }
      localSongs.push(newLocalSong)
      await this.saveLocalSongs(localSongs)

      return { success: true, message: "下载成功", path: writeResult.uri }
    } catch (error) {
      console.error("下载歌曲失败:", error)
      // 处理用户取消选择的情况
      if (error.message && error.message.includes("canceled")) {
        return { success: false, message: "操作已取消" }
      }
      return { success: false, message: "下载失败: " + error.message }
    }
  }

  // 保存本地歌曲
  async saveLocalSongs(songs) {
    return await storageAdapter.set("LocalSongs", songs)
  }

  // 打开文件选择对话框
  async openFileDialog() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log("打开文件选择对话框")
    return []
  }

  // 检查更新
  async checkForUpdates() {
    // 简化实现，实际项目中可能需要自定义更新检查逻辑
    console.log("检查更新")
    return { success: false, message: "暂不支持检查更新" }
  }

  // 打开下载页面
  async openDownloadPage(url) {
    // 使用浏览器打开链接
    window.open(url, "_blank")
    return { success: true }
  }
}

export default new ApiService()
