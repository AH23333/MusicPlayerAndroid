import storageAdapter from "./storageAdapter.js"

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
    try {
      const lyricUrl = `https://api.qijieya.cn/meting/?server=netease&type=lrc&id=${songId}`

      const response = await fetch(lyricUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      })

      if (!response.ok) {
        // 如果直接请求失败，尝试使用 CORS 代理
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(lyricUrl)}`
        const proxyResponse = await fetch(proxyUrl)

        if (!proxyResponse.ok) {
          throw new Error(`获取歌词失败，状态码：${proxyResponse.status}`)
        }

        return await proxyResponse.json()
      }

      return await response.json()
    } catch (error) {
      console.error("获取歌词失败:", error)
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
  async savePlaylistCover(data) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log("保存歌单封面:", data)
    return { success: false, message: "暂不支持保存封面" }
  }

  // 导出歌单
  async exportPlaylist(playlist) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log("导出歌单:", playlist)
    return { success: false, message: "暂不支持导出歌单" }
  }

  // 导入歌单
  async importPlaylist() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log("导入歌单")
    return { success: false, message: "暂不支持导入歌单" }
  }

  // 导出用户信息
  async exportUserInfo() {
    try {
      // 导入Capacitor插件
      const { Filesystem, Directory } = await import("@capacitor/filesystem")

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
      // 导入Capacitor插件
      const { Filesystem, Directory } = await import("@capacitor/filesystem")
      const { FilePicker } = await import("@capawesome/capacitor-file-picker")

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
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    return []
  }

  // 导入本地歌曲
  async importLocalSongs(filePaths) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log("导入本地歌曲:", filePaths)
    return { success: false, message: "暂不支持导入本地歌曲" }
  }

  // 删除本地歌曲
  async deleteLocalSong(songUrl) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log("删除本地歌曲:", songUrl)
    return { success: false, message: "暂不支持删除本地歌曲" }
  }

  // 下载歌曲
  async downloadSong(song) {
    try {
      // 导入Capacitor插件
      const { Filesystem, Directory } = await import("@capacitor/filesystem")
      const { FilePicker } = await import("@capawesome/capacitor-file-picker")

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
