class CustomFetch {
  private baseURL: string;
  private headerGetters: Map<string, () => string | null> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  public setHeaderGetter(headerName: string, callback: () => string | null) {
    this.headerGetters.set(headerName, callback);
  }

  private getFullURL(path: string, params?: Record<string, any>): string {
    // 移除 baseURL 末尾的斜杠和 path 开头的斜杠，然后用单个斜杠连接
    const cleanBaseURL = this.baseURL.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    const url = `${cleanBaseURL}/${cleanPath}`;

    // 如果有 params，添加到 URL 中
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      return `${url}?${searchParams.toString()}`;
    }

    return url;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error('请求参数错误');
        case 401:
          throw new Error('未授权，请重新登录');
        case 403:
          throw new Error('拒绝访问');
        case 404:
          throw new Error('请求地址不存在');
        case 500:
          throw new Error('服务器内部错误');
        default:
          throw new Error(`HTTP错误: ${response.status}`);
      }
    }

    try {
      // 优先尝试解析为 JSON
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        // 如果解析 JSON 失败，返回原始文本
        return text;
      }
    } catch (error) {
      throw new Error('响应解析失败');
    }
  }

  public async request<T = any>(path: string, options: RequestInit = {}, params?: Record<string, any>): Promise<T> {
    const fullURL = this.getFullURL(path, params);
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    
    // 设置所有注册的headers
    this.headerGetters.forEach((getter, headerName) => {
      const value = getter();
      if (value) {
        if (headerName === 'Authorization') {
          headers.set(headerName, `Bearer ${value}`);
        } else {
          headers.set(headerName, value);
        }
      }
    });

    const config: RequestInit = {
      ...options,
      headers,
    };

    // 如果有 body 且是对象，转换为 JSON 字符串
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {

      const response = await window.fetch(fullURL, config);

      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`请求失败: ${error.message}`);
      }
      throw new Error('请求失败');
    }
  }

  public async get<T = any>(path: string, params?: Record<string, any>, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' }, params);
  }

  public async post<T = any>(path: string, data?: any, params?: Record<string, any>, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data,
    }, params);
  }

  public async put<T = any>(path: string, data?: any, params?: Record<string, any>, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data,
    }, params);
  }

  public async delete<T = any>(path: string, params?: Record<string, any>, options: Omit<RequestInit, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' }, params);
  }
}

const isLocal = ['192.168', 'localhost', '127.0.0.1'].filter(item => window.location.hostname.includes(item)).length > 0;

// 创建实例
const httpClient = new CustomFetch(isLocal ? '/api' : 'https://api.pixpro.cc/api');

export default httpClient;
