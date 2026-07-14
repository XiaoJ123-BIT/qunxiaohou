export {}

declare global {
  interface Window {
    api: {
      // wechat-cli
      getGroupSessions: () => Promise<any[]>
      getHistory: (chatName: string, startTime?: string, endTime?: string, limit?: number) => Promise<any[]>
      searchMessages: (keyword: string, chatName?: string) => Promise<any[]>
      getStats: (chatName: string, startTime?: string, endTime?: string) => Promise<any>
      getMembers: (chatName: string) => Promise<any[]>

      // LLM
      analyzeMessages: (messages: string, prompt: string) => Promise<string>
      generateDailyReport: (chatName: string, date?: string) => Promise<string>

      // Monitor (per-group)
      startGroupMonitor: (config: { groupName: string; prompt: string; intervalMs: number }) => Promise<{ success: boolean }>
      stopGroupMonitor: (groupName: string) => Promise<{ success: boolean }>
      stopAllMonitors: () => Promise<{ success: boolean }>
      getGroupMonitorStatus: (groupName: string) => Promise<{ isRunning: boolean; prompt: string; intervalMs: number }>
      getAllMonitorStatuses: () => Promise<Record<string, { isRunning: boolean; prompt: string; intervalMs: number }>>
      getMonitorBatches: (groupName?: string, limit?: number) => Promise<any[]>
      getMonitorResults: (limit?: number) => Promise<any[]>

      // Monitor config persistence
      saveMonitorConfig: (groupName: string, config: { prompt: string; intervalMs: number }) => Promise<{ success: boolean }>
      getMonitorConfig: (groupName: string) => Promise<{ prompt: string; intervalMs: number } | null>
      getAllMonitorConfigs: () => Promise<Array<{ groupName: string; prompt: string; intervalMs: number; enabled: boolean }>>

      // Settings
      saveSettings: (settings: { apiKey: string; model: string; apiBase: string; wechatCliPath?: string; tokenUserId?: string; userToken?: string }) => Promise<{ success: boolean }>
      getSettings: () => Promise<{ apiKey: string; model: string; apiBase: string; wechatCliPath?: string; tokenUserId?: string; userToken?: string }>
      checkWechatCli: () => Promise<{ available: boolean; message: string }>

      // Analysis History
      saveAnalysis: (data: { chatNames: string[]; prompt: string; result: string; messageCount: number; timeRange?: string }) => Promise<{ success: boolean }>
      getAnalysisHistory: (limit?: number) => Promise<any[]>
      getAnalysisById: (id: number) => Promise<any>

      // Custom Templates
      getCustomTemplates: () => Promise<any[]>
      saveCustomTemplates: (templates: any[]) => Promise<{ success: boolean }>

      // Save Image
            // Save Image
      saveImage: (data: { title: string; prompt: string; content: string; timestamp: number; groupName: string }) => Promise<{ saved: boolean; filePath?: string }>

      // Events
      onMonitorBatch: (callback: (batch: any) => void) => void
      removeMonitorBatchListener: () => void
    }
  }
}
