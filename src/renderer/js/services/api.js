import storageAdapter from './storageAdapter.js'

// 封装 API 调用
class ApiService {
  // 搜索音乐
  async searchMusic(keyword, offset = 0) {
    try {
      // 构建搜索 URL
      const searchUrl = `https://163api.qijieya.cn/cloudsearch?keywords=${encodeURIComponent(keyword)}&offset=${offset}&limit=20`;
      
      // 使用 fetch 进行网络请求
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://music.163.com/",
          Origin: "https://music.163.com/",
        },
      });
      
      if (!response.ok) {
        // 如果直接请求失败，尝试使用 CORS 代理
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        
        if (!proxyResponse.ok) {
          throw new Error(`搜索失败，状态码：${proxyResponse.status}`);
        }
        
        return await proxyResponse.json();
      }
      
      return await response.json();
    } catch (error) {
      console.error('搜索音乐失败:', error);
      return { result: { songs: [] } };
    }
  }

  // 保存播放列表
  async savePlaylist(playlist) {
    return await storageAdapter.set('PlayList', playlist);
  }

  // 读取播放列表
  async readPlaylist() {
    return await storageAdapter.get('PlayList', []);
  }

  // 获取歌词
  async fetchLyrics(songId) {
    try {
      const lyricUrl = `https://api.qijieya.cn/meting/?server=netease&type=lrc&id=${songId}`;
      
      const response = await fetch(lyricUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });
      
      if (!response.ok) {
        // 如果直接请求失败，尝试使用 CORS 代理
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(lyricUrl)}`;
        const proxyResponse = await fetch(proxyUrl);
        
        if (!proxyResponse.ok) {
          throw new Error(`获取歌词失败，状态码：${proxyResponse.status}`);
        }
        
        return await proxyResponse.json();
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取歌词失败:', error);
      return null;
    }
  }

  // 读取我喜欢的歌曲
  async readLikedSongs() {
    return await storageAdapter.get('MyFavorite', []);
  }

  // 保存我喜欢的歌曲
  async saveLikedSongs(likedSongs) {
    return await storageAdapter.set('MyFavorite', likedSongs);
  }

  // 读取关注歌手
  async readFollowedArtists() {
    return await storageAdapter.get('FollowedArtists', []);
  }

  // 保存关注歌手
  async saveFollowedArtists(followedArtists) {
    return await storageAdapter.set('FollowedArtists', followedArtists);
  }

  // 读取自定义歌单
  async readCustomPlaylists() {
    return await storageAdapter.get('CustomPlaylists', []);
  }

  // 保存自定义歌单
  async saveCustomPlaylists(playlists) {
    return await storageAdapter.set('CustomPlaylists', playlists);
  }

  // 读取最近播放
  async readLatestPlayed() {
    return await storageAdapter.get('Latest', []);
  }

  // 保存最近播放
  async saveLatestPlayed(latestPlayed) {
    return await storageAdapter.set('Latest', latestPlayed);
  }

  // 读取自建歌单
  async readDIYPlaylists() {
    return await storageAdapter.get('DIYSongList', []);
  }

  // 保存自建歌单
  async saveDIYPlaylists(playlists) {
    return await storageAdapter.set('DIYSongList', playlists);
  }

  // 保存歌单封面
  async savePlaylistCover(data) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('保存歌单封面:', data);
    return { success: false, message: '暂不支持保存封面' };
  }

  // 导出歌单
  async exportPlaylist(playlist) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('导出歌单:', playlist);
    return { success: false, message: '暂不支持导出歌单' };
  }

  // 导入歌单
  async importPlaylist() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('导入歌单');
    return { success: false, message: '暂不支持导入歌单' };
  }

  // 导出用户信息
  async exportUserInfo() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('导出用户信息');
    return { success: false, message: '暂不支持导出用户信息' };
  }

  // 导入用户信息
  async importUserInfo() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('导入用户信息');
    return { success: false, message: '暂不支持导入用户信息' };
  }

  // 读取搜索历史
  async readSearchHistory() {
    return await storageAdapter.get('SearchHistory', []);
  }

  // 保存搜索历史
  async saveSearchHistory(searchHistory) {
    return await storageAdapter.set('SearchHistory', searchHistory);
  }

  // 读取本地歌曲
  async readLocalSongs() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    return [];
  }

  // 导入本地歌曲
  async importLocalSongs(filePaths) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('导入本地歌曲:', filePaths);
    return { success: false, message: '暂不支持导入本地歌曲' };
  }

  // 删除本地歌曲
  async deleteLocalSong(songUrl) {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('删除本地歌曲:', songUrl);
    return { success: false, message: '暂不支持删除本地歌曲' };
  }

  // 打开文件选择对话框
  async openFileDialog() {
    // 简化实现，实际项目中可能需要使用 Capacitor Filesystem 插件
    console.log('打开文件选择对话框');
    return [];
  }

  // 检查更新
  async checkForUpdates() {
    // 简化实现，实际项目中可能需要自定义更新检查逻辑
    console.log('检查更新');
    return { success: false, message: '暂不支持检查更新' };
  }

  // 打开下载页面
  async openDownloadPage(url) {
    // 使用浏览器打开链接
    window.open(url, '_blank');
    return { success: true };
  }
}

export default new ApiService()