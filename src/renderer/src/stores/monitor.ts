import { create } from 'zustand'

export interface MonitorMatch {
  sender: string
  content: string
  analysis: string
}

export interface MonitorBatch {
  id: number
  chatName: string
  matches: MonitorMatch[]
  matchCount: number
  prompt: string
  timestamp: number
  createdAt?: string
}

interface GroupMonitorConfig {
  prompt: string
  intervalMs: number
  isRunning: boolean
}

interface MonitorState {
  // Per-group configs
  configs: Record<string, GroupMonitorConfig>
  // Results
  results: MonitorBatch[]

  // Getters
  getConfig: (groupName: string) => GroupMonitorConfig
  isGroupMonitored: (groupName: string) => boolean

  // Actions
  loadConfig: (groupName: string) => Promise<void>
  saveConfig: (groupName: string, config: { prompt: string; intervalMs: number }) => Promise<void>
  setPrompt: (groupName: string, prompt: string) => void
  setIntervalMs: (groupName: string, ms: number) => void
  startOne: (groupName: string) => Promise<void>
  stopOne: (groupName: string) => Promise<void>
  stopAll: () => Promise<void>
  fetchResults: (groupName?: string) => Promise<void>
  fetchAllStatuses: () => Promise<void>
  addBatch: (batch: MonitorBatch) => void
}

const defaultConfig = (): GroupMonitorConfig => ({
  prompt: '',
  intervalMs: 1800000,
  isRunning: false
})

export const useMonitorStore = create<MonitorState>((set, get) => ({
  configs: {},
  results: [],

  getConfig: (groupName: string) => {
    return get().configs[groupName] || defaultConfig()
  },

  isGroupMonitored: (groupName: string) => {
    return get().configs[groupName]?.isRunning ?? false
  },

  loadConfig: async (groupName: string) => {
    try {
      const config = await window.api.getMonitorConfig(groupName)
      const status = await window.api.getGroupMonitorStatus(groupName)
      set((state) => ({
        configs: {
          ...state.configs,
          [groupName]: {
            prompt: config?.prompt || '',
            intervalMs: config?.intervalMs || 1800000,
            isRunning: status.isRunning
          }
        }
      }))
    } catch {
      // Config doesn't exist yet
    }
  },

  saveConfig: async (groupName: string, config: { prompt: string; intervalMs: number }) => {
    await window.api.saveMonitorConfig(groupName, config)
    set((state) => ({
      configs: {
        ...state.configs,
        [groupName]: {
          ...state.configs[groupName],
          ...config
        }
      }
    }))
  },

  setPrompt: (groupName: string, prompt: string) => {
    set((state) => ({
      configs: {
        ...state.configs,
        [groupName]: {
          ...(state.configs[groupName] || defaultConfig()),
          prompt
        }
      }
    }))
  },

  setIntervalMs: (groupName: string, ms: number) => {
    set((state) => ({
      configs: {
        ...state.configs,
        [groupName]: {
          ...(state.configs[groupName] || defaultConfig()),
          intervalMs: ms
        }
      }
    }))
  },

  startOne: async (groupName: string) => {
    const config = get().configs[groupName] || defaultConfig()
    if (!config.prompt.trim()) throw new Error('请输入监控条件')

    await window.api.startGroupMonitor({
      groupName,
      prompt: config.prompt,
      intervalMs: config.intervalMs
    })
    set((state) => ({
      configs: {
        ...state.configs,
        [groupName]: { ...config, isRunning: true }
      }
    }))
  },

  stopOne: async (groupName: string) => {
    await window.api.stopGroupMonitor(groupName)
    set((state) => ({
      configs: {
        ...state.configs,
        [groupName]: {
          ...(state.configs[groupName] || defaultConfig()),
          isRunning: false
        }
      }
    }))
  },

  stopAll: async () => {
    await window.api.stopAllMonitors()
    set((state) => {
      const newConfigs = { ...state.configs }
      for (const key of Object.keys(newConfigs)) {
        newConfigs[key] = { ...newConfigs[key], isRunning: false }
      }
      return { configs: newConfigs }
    })
  },

  fetchResults: async (groupName?: string) => {
    const results = await window.api.getMonitorBatches(groupName, 100)
    set({ results })
  },

  fetchAllStatuses: async () => {
    const statuses = await window.api.getAllMonitorStatuses()
    set((state) => {
      const newConfigs = { ...state.configs }
      for (const [name, status] of Object.entries(statuses)) {
        newConfigs[name] = {
          ...(newConfigs[name] || defaultConfig()),
          isRunning: status.isRunning,
          prompt: status.prompt,
          intervalMs: status.intervalMs
        }
      }
      return { configs: newConfigs }
    })
  },

  addBatch: (batch: MonitorBatch) => {
    set((state) => ({
      results: [batch, ...state.results].slice(0, 100)
    }))
  }
}))
