import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // wechat-cli
  getGroupSessions: () => ipcRenderer.invoke('get-group-sessions'),
  getHistory: (chatName: string, startTime?: string, endTime?: string, limit?: number) =>
    ipcRenderer.invoke('get-history', chatName, startTime, endTime, limit),
  searchMessages: (keyword: string, chatName?: string) =>
    ipcRenderer.invoke('search-messages', keyword, chatName),
  getStats: (chatName: string, startTime?: string, endTime?: string) =>
    ipcRenderer.invoke('get-stats', chatName, startTime, endTime),
  getMembers: (chatName: string) => ipcRenderer.invoke('get-members', chatName),

  // LLM
  analyzeMessages: (messages: string, prompt: string) =>
    ipcRenderer.invoke('analyze-messages', messages, prompt),
  generateDailyReport: (chatName: string, date?: string) =>
    ipcRenderer.invoke('generate-daily-report', chatName, date),

  // Monitor (per-group)
  startGroupMonitor: (config: { groupName: string; prompt: string; intervalMs: number }) =>
    ipcRenderer.invoke('start-group-monitor', config),
  stopGroupMonitor: (groupName: string) =>
    ipcRenderer.invoke('stop-group-monitor', groupName),
  stopAllMonitors: () => ipcRenderer.invoke('stop-all-monitors'),
  getGroupMonitorStatus: (groupName: string) =>
    ipcRenderer.invoke('get-group-monitor-status', groupName),
  getAllMonitorStatuses: () => ipcRenderer.invoke('get-all-monitor-statuses'),
  getMonitorBatches: (groupName?: string, limit?: number) =>
    ipcRenderer.invoke('get-monitor-batches', groupName, limit),
  getMonitorResults: (limit?: number) => ipcRenderer.invoke('get-monitor-results', limit),

  // Monitor config persistence
  saveMonitorConfig: (groupName: string, config: { prompt: string; intervalMs: number }) =>
    ipcRenderer.invoke('save-monitor-config', groupName, config),
  getMonitorConfig: (groupName: string) =>
    ipcRenderer.invoke('get-monitor-config', groupName),
  getAllMonitorConfigs: () => ipcRenderer.invoke('get-all-monitor-configs'),

  // Settings
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  checkWechatCli: () => ipcRenderer.invoke('check-wechat-cli'),

  // Analysis History
  saveAnalysis: (data: SaveAnalysisParams) => ipcRenderer.invoke('save-analysis', data),
  getAnalysisHistory: (limit?: number) => ipcRenderer.invoke('get-analysis-history', limit),
  getAnalysisById: (id: number) => ipcRenderer.invoke('get-analysis-by-id', id),

  // Custom Templates
  getCustomTemplates: () => ipcRenderer.invoke('get-custom-templates'),
  saveCustomTemplates: (templates: CustomTemplateItem[]) => ipcRenderer.invoke('save-custom-templates', templates),

    // Save Image
  saveImage: (data: { title: string; prompt: string; content: string; timestamp: number; groupName: string }) => ipcRenderer.invoke('save-image', data),

  // Events
  onMonitorBatch: (callback: (batch: MonitorBatch) => void) => {
    ipcRenderer.on('monitor-batch', (_event, batch) => callback(batch))
  },
  removeMonitorBatchListener: () => {
    ipcRenderer.removeAllListeners('monitor-batch')
  }
}

export interface AppSettings {
  apiKey: string
  model: string
  apiBase: string
  wechatCliPath?: string
  tokenUserId?: string
  userToken?: string
}

export interface MonitorBatch {
  id: number
  chatName: string
  matches: { sender: string; content: string; analysis: string }[]
  matchCount: number
  prompt: string
  timestamp: number
  createdAt?: string
}

export interface SaveAnalysisParams {
  chatNames: string[]
  prompt: string
  result: string
  messageCount: number
  timeRange?: string
}

export interface CustomTemplateItem {
  label: string
  prompt: string
  createdAt: number
}

contextBridge.exposeInMainWorld('api', api)
