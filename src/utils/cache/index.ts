/*
 * @Author: 璐 Lu.xu@brandsh.cn
 * @Date: 2025-03-26 11:51:46
 * @LastEditors: 璐 Lu.xu@brandsh.cn
 * @LastEditTime: 2025-03-26 12:06:17
 * @FilePath: /pixpro/utils/cache/index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

enum CacheType {
  Local = "local",
  Session = "session",
}

class Cache {
  storage: Storage;
  constructor(type: CacheType) {
    this.storage = type === CacheType.Local ? localStorage : sessionStorage;
  }

  setCache(key: string, value: any) {
    if (value) {
      this.storage.setItem(key, JSON.stringify(value));
    }
  }

  getCache(key: string) {
    const value = this.storage.getItem(key);
    try {
      return JSON.parse(value as string);
    } catch (error) {
      return value;
    }
  }

  removeCache(key: string) {
    this.storage.removeItem(key);
  }

  clear() {
    this.storage.clear();
  }
}

const localCache = new Cache(CacheType.Local);
const sessionCache = new Cache(CacheType.Session);

export { localCache, sessionCache };
