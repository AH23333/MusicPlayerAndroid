// 存储适配器，统一处理存储操作
// 支持 Capacitor Preferences 和浏览器 localStorage

class StorageAdapter {
  constructor() {
    this.isCapacitor = typeof window.Capacitor !== 'undefined';
  }

  // 检查环境
  getEnvironment() {
    if (this.isCapacitor) return 'capacitor';
    return 'browser';
  }

  // 保存数据
  async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      
      if (this.isCapacitor && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        // 使用 Capacitor Preferences
        await window.Capacitor.Plugins.Preferences.set({
          key: key,
          value: jsonValue
        });
      } else {
        // 使用 localStorage 作为浏览器 fallback
        localStorage.setItem(key, jsonValue);
      }
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  }

  // 读取数据
  async get(key, defaultValue = []) {
    try {
      let jsonValue;
      
      if (this.isCapacitor && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        // 使用 Capacitor Preferences
        const result = await window.Capacitor.Plugins.Preferences.get({ key: key });
        jsonValue = result.value;
      } else {
        // 使用 localStorage 作为浏览器 fallback
        jsonValue = localStorage.getItem(key);
      }
      
      return jsonValue ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error('读取数据失败:', error);
      return defaultValue;
    }
  }

  // 删除数据
  async remove(key) {
    try {
      if (this.isCapacitor && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        // 使用 Capacitor Preferences
        await window.Capacitor.Plugins.Preferences.remove({ key: key });
      } else {
        // 使用 localStorage 作为浏览器 fallback
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  }

  // 清空所有数据
  async clear() {
    try {
      if (this.isCapacitor && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        // 使用 Capacitor Preferences
        await window.Capacitor.Plugins.Preferences.clear();
      } else {
        // 使用 localStorage 作为浏览器 fallback
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }
}

export default new StorageAdapter();
