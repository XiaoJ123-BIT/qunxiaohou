import { create } from 'zustand'
import { useSettingsStore } from './settings'

export interface Message {
  chat: string
  sender: string
  content: string
  msg_type: string
  timestamp: number
  time: string
}

export interface TimeRangeOption {
  label: string
  value: string
  getRange: () => { start: string; end: string }
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '最近 1 小时', value: '1h', getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 60 * 60 * 1000)
    return { start: formatDateTime(start), end: formatDateTime(now) }
  }},
  { label: '最近 6 小时', value: '6h', getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    return { start: formatDateTime(start), end: formatDateTime(now) }
  }},
  { label: '最近 24 小时', value: '24h', getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return { start: formatDateTime(start), end: formatDateTime(now) }
  }},
  { label: '最近 3 天', value: '3d', getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    return { start: formatDateTime(start), end: formatDateTime(now) }
  }},
  { label: '最近 7 天', value: '7d', getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { start: formatDateTime(start), end: formatDateTime(now) }
  }},
  { label: '最近 30 天', value: '30d', getRange: () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { start: formatDateTime(start), end: formatDateTime(now) }
  }},
  { label: '自定义', value: 'custom', getRange: () => ({ start: '', end: '' }) }
]

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export interface AnalysisHistoryItem {
  id: number
  chat_names: string
  prompt: string
  result: string
  message_count: number
  time_range: string | null
  created_at: string
}

interface AnalysisState {
  messages: Message[]
  selectedTimeRange: string
  customStart: string
  customEnd: string
  prompt: string
  result: string
  analyzing: boolean
  currentGroupName: string | null
  history: AnalysisHistoryItem[]
  historyLoading: boolean

  setMessages: (messages: Message[]) => void
  setSelectedTimeRange: (range: string) => void
  setCustomStart: (start: string) => void
  setCustomEnd: (end: string) => void
  setPrompt: (prompt: string) => void
  setResult: (result: string) => void
  setAnalyzing: (analyzing: boolean) => void
  setCurrentGroupName: (name: string | null) => void

  fetchMessages: (chatName: string) => Promise<void>
  analyze: (chatNames?: string[]) => Promise<void>
  generateDailyReport: (chatName: string) => Promise<void>
  loadHistory: () => Promise<void>
  loadHistoryItem: (id: number) => Promise<void>
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  messages: [],
  selectedTimeRange: '24h',
  customStart: '',
  customEnd: '',
  prompt: '',
  result: '',
  analyzing: false,
  currentGroupName: null,
  history: [],
  historyLoading: false,

  setMessages: (messages) => set({ messages }),
  setSelectedTimeRange: (range) => {
    set({ selectedTimeRange: range })
    const state = get()
    // Re-fetch messages when time range changes if a group is selected
    if (state.currentGroupName) {
      get().fetchMessages(state.currentGroupName)
    }
  },
  setCustomStart: (start) => {
    set({ customStart: start })
    const state = get()
    if (state.selectedTimeRange === 'custom' && state.currentGroupName && start && state.customEnd) {
      get().fetchMessages(state.currentGroupName)
    }
  },
  setCustomEnd: (end) => {
    set({ customEnd: end })
    const state = get()
    if (state.selectedTimeRange === 'custom' && state.currentGroupName && state.customStart && end) {
      get().fetchMessages(state.currentGroupName)
    }
  },
  setPrompt: (prompt) => set({ prompt }),
  setResult: (result) => set({ result }),
  setAnalyzing: (analyzing) => set({ analyzing }),
  setCurrentGroupName: (name) => set({ currentGroupName: name }),

  fetchMessages: async (chatName: string) => {
    set({ currentGroupName: chatName })
    const state = get()
    const { start, end } = state.selectedTimeRange === 'custom'
      ? { start: state.customStart, end: state.customEnd }
      : TIME_RANGE_OPTIONS.find(o => o.value === state.selectedTimeRange)?.getRange() || { start: '', end: '' }

    try {
      const data = await window.api.getHistory(chatName, start, end, 50000)
      const messages = Array.isArray(data) ? data : (data.messages || [])
      set({ messages })
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  },

  analyze: async (chatNames?: string[]) => {
    const state = get()
    set({ analyzing: true, result: '' })

    try {
      const names = chatNames || (state.currentGroupName ? [state.currentGroupName] : [])
      if (names.length === 0) throw new Error('请选择群聊')

      // Compute time range from current selection
      const { start, end } = state.selectedTimeRange === 'custom'
        ? { start: state.customStart, end: state.customEnd }
        : TIME_RANGE_OPTIONS.find(o => o.value === state.selectedTimeRange)?.getRange() || { start: '', end: '' }

      let allMessages = ''
      for (const name of names) {
        // Always fetch with current time range, high limit for full history
        const data = await window.api.getHistory(name, start, end, 50000)
        const rawMsgs = Array.isArray(data) ? data : (data.messages || [])
        const msgs = rawMsgs.map((m: any) => ({
          chat: m.chat || name,
          sender: m.sender || '未知',
          content: m.content || '',
          msg_type: m.msg_type || 'text',
          timestamp: m.timestamp || 0,
          time: m.time || ''
        })).filter((m: Message) => m.content)

        if (msgs.length === 0) {
          console.warn(`群聊 "${name}" 没有获取到消息`)
          continue
        }

        allMessages += `\n=== 群聊: ${name} ===\n` + msgs.map((m: Message) => `[${m.time}] ${m.sender}: ${m.content}`).join('\n') + '\n\n'
      }

      if (!allMessages.trim()) {
        set({ result: '未能获取到任何消息，请检查：\n1. 微信是否正在运行\n2. 选择的群聊是否有消息记录\n3. 时间范围设置是否正确' })
        return
      }

      const result = await window.api.analyzeMessages(allMessages, state.prompt)
      set({ result })

      await window.api.saveAnalysis({
        chatNames: names,
        prompt: state.prompt,
        result,
        messageCount: names.length === 1 ? state.messages.length : 0,
        timeRange: state.selectedTimeRange
      })
      // Refresh history after saving
      get().loadHistory()
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_BALANCE') {
        set({ result: '余额不足，请先充值后再使用 AI 分析功能。' })
        useSettingsStore.getState().openTokenPay()
      } else {
        set({ result: `分析失败: ${err.message}` })
      }
    } finally {
      set({ analyzing: false })
    }
  },

  generateDailyReport: async (chatName: string) => {
    set({ analyzing: true, result: '' })
    try {
      const report = await window.api.generateDailyReport(chatName)
      set({ result: `## ${chatName} - 今日群日报\n\n${report}` })
      get().loadHistory()
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_BALANCE') {
        set({ result: '余额不足，请先充值后再使用 AI 分析功能。' })
        useSettingsStore.getState().openTokenPay()
      } else {
        set({ result: `日报生成失败: ${err.message}` })
      }
    } finally {
      set({ analyzing: false })
    }
  },

  loadHistory: async () => {
    set({ historyLoading: true })
    try {
      const history = await window.api.getAnalysisHistory()
      set({ history, historyLoading: false })
    } catch {
      set({ historyLoading: false })
    }
  },

  loadHistoryItem: async (id: number) => {
    try {
      const item = await window.api.getAnalysisById(id)
      if (item) {
        const chatNames = Array.isArray(item.chatNames) ? item.chatNames : JSON.parse(item.chat_names)
        set({
          result: item.result,
          prompt: item.prompt,
          currentGroupName: chatNames.length === 1 ? chatNames[0] : null
        })
      }
    } catch (err) {
      console.error('Failed to load history item:', err)
    }
  }
}))