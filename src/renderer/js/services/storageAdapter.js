// 存储适配器，统一处理存储操作
// 支持 Capacitor Preferences 和浏览器 localStorage

class StorageAdapter {
  constructor() {
    this.capacitorReady = false
    this.initPromise = this.initCapacitor()
  }

  // 初始化 Capacitor
  async initCapacitor() {
    // 如果 Capacitor 已经可用，直接标记为 ready
    if (this.isCapacitorAvailable()) {
      this.capacitorReady = true
      console.log("[Storage] Capacitor 存储已就绪")
      return
    }

    // 等待 Capacitor 初始化，最多等待 5 秒
    const startTime = Date.now()
    while (!this.capacitorReady && Date.now() - startTime < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (this.isCapacitorAvailable()) {
        this.capacitorReady = true
        console.log("[Storage] Capacitor 存储初始化完成")
        return
      }
    }

    // 5 秒后仍未检测到 Capacitor，说明可能不在 Capacitor 环境中
    if (!this.capacitorReady) {
      console.warn("[Storage] 未检测到 Capacitor 环境，使用浏览器 localStorage")
    }
  }

  // 确保初始化完成
  async ensureReady() {
    if (!this.initPromise) {
      this.initPromise = this.initCapacitor()
    }
    await this.initPromise
  }

  // 检查 Capacitor 是否可用
  isCapacitorAvailable() {
    return (
      typeof window !== "undefined" &&
      typeof window.Capacitor !== "undefined" &&
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.Preferences
    )
  }

  // 检查环境
  getEnvironment() {
    if (this.capacitorReady && this.isCapacitorAvailable()) return "capacitor"
    return "browser"
  }

  // 保存数据
  async set(key, value) {
    // 确保初始化完成
    await this.ensureReady()
    
    try {
      const jsonValue = JSON.stringify(value)

      // 优先使用 Capacitor Preferences
      if (this.capacitorReady && this.isCapacitorAvailable()) {
        // 使用 Capacitor Preferences
        await window.Capacitor.Plugins.Preferences.set({
          key: key,
          value: jsonValue,
        })
        console.log(`[Storage] 已保存到 Capacitor Preferences: ${key}`)
        // 同时保存到 localStorage 作为备份
        try {
          localStorage.setItem(key, jsonValue)
        } catch (e) {
          // ignore localStorage error
        }
      } else {
        // 使用 localStorage 作为 fallback
        localStorage.setItem(key, jsonValue)
        console.log(`[Storage] 已保存到 localStorage: ${key}`)
      }
      return true
    } catch (error) {
      console.error("[Storage] 保存数据失败:", error)
      // 尝试使用 localStorage 作为最终 fallback
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch (e) {
        return false
      }
    }
  }

  // 读取数据
  async get(key, defaultValue = []) {
    // 确保初始化完成
    await this.ensureReady()
    
    try {
      let jsonValue = null

      // 优先使用 Capacitor Preferences
      if (this.capacitorReady && this.isCapacitorAvailable()) {
        // 使用 Capacitor Preferences
        const result = await window.Capacitor.Plugins.Preferences.get({
          key: key,
        })
        jsonValue = result.value
        if (jsonValue) {
          console.log(`[Storage] 从 Capacitor Preferences 读取: ${key}`)
        }
      }

      // 如果 Capacitor 中没有数据，尝试从 localStorage 读取
      if (!jsonValue) {
        jsonValue = localStorage.getItem(key)
        if (jsonValue) {
          console.log(`[Storage] 从 localStorage 读取: ${key}`)
          // 如果从 localStorage 读取到数据，但 Capacitor 可用，则迁移数据
          if (this.capacitorReady && this.isCapacitorAvailable()) {
            try {
              await window.Capacitor.Plugins.Preferences.set({
                key: key,
                value: jsonValue,
              })
              console.log(`[Storage] 数据已迁移到 Capacitor Preferences: ${key}`)
            } catch (e) {
              console.warn(`[Storage] 迁移数据失败: ${key}`, e)
            }
          }
        }
      }

      return jsonValue ? JSON.parse(jsonValue) : defaultValue
    } catch (error) {
      console.error("[Storage] 读取数据失败:", error)
      // 尝试从 localStorage 读取作为 fallback
      try {
        const jsonValue = localStorage.getItem(key)
        return jsonValue ? JSON.parse(jsonValue) : defaultValue
      } catch (e) {
        return defaultValue
      }
    }
  }

  // 删除数据
  async remove(key) {
    // 确保初始化完成
    await this.ensureReady()
    
    try {
      if (this.capacitorReady && this.isCapacitorAvailable()) {
        // 使用 Capacitor Preferences
        await window.Capacitor.Plugins.Preferences.remove({ key: key })
      }
      // 同时删除 localStorage 中的数据
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error("[Storage] 删除数据失败:", error)
      return false
    }
  }

  // 清空所有数据
  async clear() {
    // 确保初始化完成
    await this.ensureReady()
    
    try {
      if (this.capacitorReady && this.isCapacitorAvailable()) {
        // 使用 Capacitor Preferences
        await window.Capacitor.Plugins.Preferences.clear()
      }
      // 同时清空 localStorage
      localStorage.clear()
      return true
    } catch (error) {
      console.error("[Storage] 清空数据失败:", error)
      return false
    }
  }
}

// 创建单例实例
const storageAdapter = new StorageAdapter()
export default storageAdapter
