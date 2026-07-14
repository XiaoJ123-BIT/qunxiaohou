import { create } from 'zustand'

// 动态加载 APIShop SDK
let _APIShopLoaded = false
async function loadAPIShop(): Promise<any> {
  if ((window as any).APIShop) return (window as any).APIShop
  if (_APIShopLoaded) {
    // 已尝试加载但还是没有，等一下再试
    await new Promise(r => setTimeout(r, 500))
    return (window as any).APIShop
  }
  _APIShopLoaded = true
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://duoduo.taotoken.net/sdk.js'
    script.onload = () => resolve((window as any).APIShop)
    script.onerror = () => reject(new Error('Failed to load SDK'))
    document.head.appendChild(script)
  })
}

interface WechatCliStatus {
  available: boolean
  message: string
  checking: boolean
}

// ===== Token 平台（开发者预置，用户无感） =====
const TOKEN_CONFIG = {
  apiKey: 'app-id-c9f670adbfd41f44d9bb32699c0475c24a255c19',
  baseUrl: 'https://duoduo.taotoken.net',
}

interface SettingsState {
  apiKey: string
  model: string
  apiBase: string
  wechatCliPath: string
  wechatCliStatus: WechatCliStatus
  loading: boolean
  tokenUserId: string
  tokenBalance: number
  userToken: string

  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setApiBase: (base: string) => void
  setWechatCliPath: (path: string) => void
  setLoading: (loading: boolean) => void

  fetch: () => Promise<void>
  save: () => Promise<void>
  checkWechatCli: () => Promise<void>
  fetchTokenBalance: () => Promise<void>
  openTokenPay: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: TOKEN_CONFIG.apiKey,
  model: 'deepseek-v4-flash',
  apiBase: `${TOKEN_CONFIG.baseUrl}/v1`,
  wechatCliPath: '',
  wechatCliStatus: { available: false, message: '', checking: false },
  loading: false,
  tokenUserId: '',
  tokenBalance: 0,
  userToken: '',

  setApiKey: (key) => set({ apiKey: key }),
  setModel: (model) => set({ model }),
  setApiBase: (base) => set({ apiBase: base }),
  setWechatCliPath: (path) => set({ wechatCliPath: path }),
  setLoading: (loading) => set({ loading }),

  fetch: async () => {
    set({ loading: true })
    try {
      const settings = await window.api.getSettings()
      // 首次使用自动生成用户 ID
      if (!settings.tokenUserId) {
        settings.tokenUserId = 'u_' + crypto.randomUUID().slice(0, 8)
      }
      // 始终使用 Token 平台作为 AI 代理（用户无需配置）
      settings.apiKey = TOKEN_CONFIG.apiKey
      settings.apiBase = `${TOKEN_CONFIG.baseUrl}/v1`
      settings.model = 'deepseek-v4-flash'
      set({ ...settings, loading: false })
      get().save()
      // 自动查询余额
      get().fetchTokenBalance()
    } catch {
      set({ loading: false })
    }
  },

  save: async () => {
    const state = get()
    set({ loading: true })
    try {
      await window.api.saveSettings({
        apiKey: state.apiKey,
        model: state.model,
        apiBase: state.apiBase,
        wechatCliPath: state.wechatCliPath,
        tokenUserId: state.tokenUserId,
        userToken: state.userToken,
      })
      set({ loading: false })
    } catch {
      set({ loading: false })
    }
  },

  checkWechatCli: async () => {
    set({ wechatCliStatus: { ...get().wechatCliStatus, checking: true } })
    try {
      const result = await window.api.checkWechatCli()
      set({ wechatCliStatus: { ...result, checking: false } })
    } catch (e: any) {
      set({ wechatCliStatus: { available: false, message: e.message || '检查失败', checking: false } })
    }
  },

  fetchTokenBalance: async () => {
    const { tokenUserId } = get()
    try {
      const headers = { 'Content-Type': 'application/json' }
      const cached = localStorage.getItem(`apishop_${TOKEN_CONFIG.apiKey}`)
      if (cached) {
        const auth = JSON.parse(cached)
        if (auth.token) headers['x-user-token'] = auth.token
      }
      const res = await fetch(`${TOKEN_CONFIG.baseUrl}/api/payment/end-user/balance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ apiKey: TOKEN_CONFIG.apiKey, userId: tokenUserId }),
      })
      const data = await res.json()
      if (data.success) {
        set({ tokenBalance: data.data.total })
      }
    } catch {
      // ignore
    }
  },

  openTokenPay: async () => {
    try {
      const APIShop = await loadAPIShop()
      const shop = new APIShop({
        serverUrl: TOKEN_CONFIG.baseUrl,
        channel: TOKEN_CONFIG.apiKey,
      })
      const result = await shop.openPanel()
      // 从 SDK 缓存中提取 userToken
      const cached = localStorage.getItem(`apishop_${TOKEN_CONFIG.apiKey}`)
      const userToken = cached ? JSON.parse(cached).token || '' : ''
      set({ tokenUserId: result.userId, userToken })
      await get().save()
      get().fetchTokenBalance()
    } catch {
      // fallback: window.open
      const { tokenUserId } = get()
      const url = `${TOKEN_CONFIG.baseUrl}/pay/${TOKEN_CONFIG.apiKey}?userId=${encodeURIComponent(tokenUserId)}`
      const win = window.open(url, 'tokenPay', 'width=500,height=700,scrollbars=yes,resizable=yes')
      if (win) {
        const timer = setInterval(() => {
          if (win.closed) {
            clearInterval(timer)
            get().fetchTokenBalance()
          }
        }, 500)
      }
    }
  },
}))