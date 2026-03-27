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
    try {
      const lyricUrl = `https://api.qijieya.cn/meting/?server=netease&type=lrc&id=${songId}`
      const response = await fetch(lyricUrl)
      const text = await response.text()
      console.log("[歌词] 原始响应长度:", text.length)
      try {
        const json = JSON.parse(text)
        console.log("[歌词] 解析为JSON成功，包含lrc字段:", !!json.lrc)
        return { lrc: json.lrc || json, tlrc: json.tlrc || "" }
      } catch (e) {
        console.log("[歌词] 解析为纯文本歌词")
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
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { Filesystem } = plugins
      const Directory = Filesystem.Directory
      const base64Data = coverData.split(",")[1] // 去掉 data:image/...;base64,
      const format = coverData.match(/^data:image\/(\w+);base64,/)[1]
      const fileName = `${playlistId}.${format}`
      const filePath = `DIYSongListPage/${fileName}`

      // 确保目录存在
      try {
        await Filesystem.mkdir({
          path: "DIYSongListPage",
          directory: Directory.Documents,
          recursive: true,
        })
      } catch (error) {
        // 目录已存在，忽略错误
      }

      await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: Directory.Documents,
      })
      return { success: true, coverPath: filePath }
    } catch (error) {
      console.error("保存歌单封面失败:", error)
      return { success: false, message: error.message }
    }
  }

  // 导出歌单
  async exportPlaylist(playlist) {
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { Filesystem } = plugins
      const Directory = Filesystem.Directory
      const playlistData = {
        name: playlist.name,
        description: playlist.description,
        coverPath: playlist.coverPath,
        coverData: playlist.coverData,
        songs: playlist.songs,
      }
      const jsonData = JSON.stringify(playlistData, null, 2)
      const fileName = `${playlist.name.replace(/[^a-z0-9]/gi, "_")}.json`

      // 确保目录存在
      try {
        await Filesystem.mkdir({
          path: "PlaylistExports",
          directory: Directory.Documents,
          recursive: true,
        })
      } catch (error) {
        // 目录已存在，忽略错误
      }

      const result = await Filesystem.writeFile({
        path: `PlaylistExports/${fileName}`,
        data: jsonData,
        directory: Directory.Documents,
      })
      return {
        success: true,
        filePath: result.uri,
        message: `歌单已导出到: PlaylistExports/${fileName}`,
      }
    } catch (error) {
      console.error("导出歌单失败:", error)
      return { success: false, message: error.message }
    }
  }

  // 导入歌单
  async importPlaylist() {
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { FilePicker } = plugins
      const { Filesystem } = plugins
      const result = await FilePicker.pickFiles({
        types: ["application/json"],
        multiple: false,
      })
      if (!result.files.length) return { success: false, message: "未选择文件" }
      const file = result.files[0]
      let readResult
      try {
        readResult = await Filesystem.readFile({ path: file.path })
      } catch {
        const fileName = file.path.split("/").pop()
        readResult = await Filesystem.readFile({
          path: fileName,
          directory: Filesystem.Directory.Documents,
        })
      }
      const playlistData = JSON.parse(readResult.data)
      // 验证必要字段
      if (!playlistData.name || !Array.isArray(playlistData.songs)) {
        return { success: false, message: "无效的歌单文件" }
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
      return { success: true, message: "导入成功", playlist: newPlaylist }
    } catch (error) {
      console.error("导入歌单失败:", error)
      if (error.message && error.message.includes("canceled")) {
        return { success: false, message: "操作已取消" }
      }
      return { success: false, message: error.message }
    }
  }

  // 导出用户信息
  async exportUserInfo() {
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { Filesystem } = plugins
      const Directory = Filesystem.Directory

      // 收集用户数据
      const userData = {
        likedSongs: await this.readLikedSongs(),
        followedArtists: await this.readFollowedArtists(),
        customPlaylists: await this.readCustomPlaylists(),
        diyPlaylists: await this.readDIYPlaylists(),
        latestPlayed: await this.readLatestPlayed(),
        searchHistory: await this.readSearchHistory(),
      }

      // 转换为JSON字符串
      const jsonData = JSON.stringify(userData, null, 2)

      // 生成文件名
      const fileName = `user-info-${new Date().toISOString().slice(0, 10)}.json`

      // 写入文件
      const result = await Filesystem.writeFile({
        path: fileName,
        data: jsonData,
        directory: Directory.Documents,
      })

      return { success: true, message: "导出成功", path: result.uri }
    } catch (error) {
      console.error("导出用户信息失败:", error)
      return { success: false, message: "导出失败: " + error.message }
    }
  }

  // 导入用户信息
  async importUserInfo() {
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { Filesystem } = plugins
      const Directory = Filesystem.Directory
      const { FilePicker } = plugins

      // 选择文件
      const result = await FilePicker.pickFiles({
        types: ["application/json"],
        multiple: false,
      })

      if (!result || !result.files || result.files.length === 0) {
        return { success: false, message: "未选择文件" }
      }

      const file = result.files[0]

      // 读取文件内容
      let readResult
      try {
        // 尝试直接使用路径读取
        readResult = await Filesystem.readFile({
          path: file.path,
        })
      } catch (e) {
        // 如果失败，尝试从Documents目录读取
        const fileName = file.path.split("/").pop()
        readResult = await Filesystem.readFile({
          path: fileName,
          directory: Directory.Documents,
        })
      }

      // 解析JSON
      const userData = JSON.parse(readResult.data)

      // 保存数据（合并策略：如果新数据存在则覆盖，否则保留原有数据）
      if (userData.likedSongs) await this.saveLikedSongs(userData.likedSongs)
      if (userData.followedArtists)
        await this.saveFollowedArtists(userData.followedArtists)
      if (userData.customPlaylists)
        await this.saveCustomPlaylists(userData.customPlaylists)
      if (userData.diyPlaylists)
        await this.saveDIYPlaylists(userData.diyPlaylists)
      if (userData.latestPlayed)
        await this.saveLatestPlayed(userData.latestPlayed)
      if (userData.searchHistory)
        await this.saveSearchHistory(userData.searchHistory)

      // 刷新页面
      window.location.reload()

      return { success: true, message: "导入成功" }
    } catch (error) {
      console.error("导入用户信息失败:", error)
      // 处理用户取消选择的情况
      if (error.message && error.message.includes("canceled")) {
        return { success: false, message: "操作已取消" }
      }
      return { success: false, message: "导入失败: " + error.message }
    }
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
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { FilePicker } = plugins
      // 先请求权限（可选）
      await FilePicker.requestPermissions?.()

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
        const newSong = {
          id: Date.now() + Math.random(),
          name: title,
          artist: artist,
          album: "本地专辑",
          url: file.path,
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
    try {
      const plugins = await getCapacitorPlugins()
      if (!plugins) {
        throw new Error("Capacitor 插件不可用")
      }
      const { Filesystem } = plugins
      const Directory = Filesystem.Directory
      const { FilePicker } = plugins

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
          directory: Directory.Documents,
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
      const safeFileName = `${song.name.replace(/[<>"/\\|?*]/g, "")} - ${song.ar[0].name.replace(/[<>"/\\|?*]/g, "")}.mp3`

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
          directory: Directory.Documents,
        })
      }

      // 将歌曲信息添加到本地歌曲列表
      const localSongs = await this.readLocalSongs()
      const newLocalSong = {
        id: song.id,
        name: song.name,
        artist: song.ar[0].name,
        album: song.al.name,
        url: writeResult.uri,
        cover: song.al.picUrl,
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
