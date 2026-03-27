// 通用工具函数

// API配置
const API_CONFIGS = {
  neteaseSearch: { url: "https://163api.qijieya.cn/cloudsearch" },
  metingFallback: { url: "https://api.qijieya.cn/meting/" },
  neteaseSongDetail: { url: "https://163api.qijieya.cn/song/detail" },
  neteaseLyric: { url: "https://163api.qijieya.cn/lyric/new" },
  neteaseAudioUrl: { url: "https://api.qijieya.cn/meting/" },
}

// 时间格式化
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// 解析歌词
function parseLyrics(lyricText) {
  if (!lyricText) return []
  const lyrics = []
  const lines = lyricText.split("\n")
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:[:.](\d{2,3}))?\]/g

  lines.forEach((line) => {
    const matches = [...line.matchAll(timeRegex)]
    if (matches.length > 0) {
      const text = line.replace(timeRegex, "").trim()
      if (text) {
        matches.forEach((match) => {
          const minutes = parseInt(match[1])
          const seconds = parseInt(match[2])
          const milliseconds = match[3] ? parseInt(match[3].padEnd(3, "0")) : 0
          const time = minutes * 60 + seconds + milliseconds / 1000
          lyrics.push({ time, text })
        })
      }
    }
  })

  return lyrics
    .sort((a, b) => a.time - b.time)
    .filter((lyric, index, array) => {
      return index === 0 || lyric.time !== array[index - 1].time
    })
}

// 防抖函数
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
function throttle(func, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 深拷贝
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map((item) => deepClone(item))
  if (typeof obj === "object") {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 生成唯一ID
function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 随机打乱数组
function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// 检查对象是否为空
function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

// 格式化歌曲标题
function formatSongTitle(title) {
  if (!title) return "未知歌曲"
  // 移除括号内的内容（如 (Live)、(Remix) 等）
  return title.replace(/\s*\([^)]*\)\s*/g, "").trim()
}

// 格式化歌手名称
function formatArtistName(artist) {
  if (!artist) return "未知歌手"
  return artist.trim()
}

// 格式化歌手列表
function formatArtists(artists) {
  return (
    (artists ?? [])
      .map((artist) => artist.name?.trim())
      .filter(Boolean)
      .join("/") || "未知歌手"
  )
}

// 映射网易云歌曲到轨道格式
function mapNeteaseSongToTrack(song) {
  if (!song || !song.id) return null
  return {
    id: song.id.toString(),
    songId: song.id.toString(),
    name: song.name?.trim() ?? "未知歌曲",
    artist: formatArtists(song.ar),
    album: song.al?.name?.trim() ?? "未知专辑",
    coverUrl: song.al?.picUrl?.replaceAll("http:", "https:") ?? "",
    duration: song.dt ?? 0,
    url: `${API_CONFIGS.neteaseAudioUrl.url}?type=url&id=${song.id}`,
  }
}

// 歌词解析
const TIMESTAMP_REGEX = /^\[(\d{2}):(\d{2})[\.:](\d{2,3})\](.*)$/
const METADATA_KEYWORDS = ["歌词贡献者", "翻译贡献者", "作词", "作曲", "编曲"]
const metadataKeywordPattern = METADATA_KEYWORDS.map((keyword) => {
  return keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}).join("|")
const metadataKeywordRegex = new RegExp(
  `^(${metadataKeywordPattern})\\s*[:：]`,
  "iu"
)

function extractCleanLyrics(content) {
  if (!content) return { clean: "", metadata: [] }
  const metadataSet = new Set()
  const bodyLines = []

  content.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    if (trimmed.match(TIMESTAMP_REGEX)) {
      const match = trimmed.match(TIMESTAMP_REGEX)
      const content = match[4].trim()
      if (metadataKeywordRegex.test(content)) {
        metadataSet.add(content)
        return
      }
    }
    bodyLines.push(line)
  })

  return {
    clean: bodyLines.join("\n").trim(),
    metadata: Array.from(metadataSet),
  }
}

// CORS代理请求
async function fetchViaProxy(targetUrl) {
  console.log(`发起请求：${targetUrl}`)
  let text

  // 直连请求
  try {
    console.log(`尝试直连请求：${targetUrl}`)
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://music.163.com/",
        Origin: "https://music.163.com/",
      },
    })
    if (!response.ok) throw new Error(`直连失败，状态码：${response.status}`)
    text = await response.text()
    console.log(`直连请求成功，返回数据长度：${text.length}`)
    return JSON.parse(text)
  } catch (directErr) {
    // 代理请求
    console.warn(`直连失败（原因：${directErr.message}），尝试CORS代理`)
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
      console.log(`代理请求地址：${proxyUrl}`)
      const proxyRes = await fetch(proxyUrl)
      if (!proxyRes.ok) throw new Error(`代理失败，状态码：${proxyRes.status}`)
      text = await proxyRes.text()
      const result = typeof text === "string" ? JSON.parse(text) : text
      console.log(
        `代理请求成功，返回数据长度：${JSON.stringify(result).length}`
      )
      return result
    } catch (proxyErr) {
      console.error(
        `直连+代理都失败：${proxyErr.message}，目标地址：${targetUrl}`
      )
      return null
    }
  }
}

// 获取歌词
async function fetchLyricsById(songId) {
  if (!songId) return null
  // 使用Meting API获取歌词
  const lyricUrl = `${API_CONFIGS.metingFallback.url}?server=netease&type=lrc&id=${songId}`
  const lyricData = await fetchViaProxy(lyricUrl)

  if (!lyricData) return null

  // 处理返回的数据
  let lrc = ""
  let tlrc = ""
  const metadata = []

  if (typeof lyricData === "string") {
    // 如果返回的是字符串，直接作为歌词
    lrc = lyricData
  } else if (lyricData.lrc) {
    // 如果返回的是对象，提取lrc字段
    lrc = lyricData.lrc
  }

  return {
    lrc: lrc || "",
    tlrc: tlrc || "",
    metadata: metadata,
  }
}

// 在浏览器环境中挂载到全局对象
if (typeof window !== "undefined") {
  window.helpers = {
    API_CONFIGS,
    formatTime,
    parseLyrics,
    debounce,
    throttle,
    deepClone,
    generateId,
    shuffleArray,
    isEmpty,
    formatSongTitle,
    formatArtistName,
    formatArtists,
    mapNeteaseSongToTrack,
    extractCleanLyrics,
    fetchViaProxy,
    fetchLyricsById,
  }
}
