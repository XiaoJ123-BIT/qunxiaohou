import { ipcMain, BrowserWindow, dialog } from 'electron'
import * as fs from 'fs'
import { marked } from 'marked'
import * as wechatCli from './services/wechat-cli'
import { analyzeMessages, generateDailyReport } from './services/llm'
import * as db from './services/db'
import { startGroupMonitor, stopGroupMonitor, stopAllMonitors, getGroupMonitorStatus, getAllMonitorStatuses } from './services/monitor'

function getSettings() {
  const apiKey = db.getSetting('apiKey') || ''
  const model = db.getSetting('model') || 'deepseek-v4-flash'
  const apiBase = db.getSetting('apiBase') || 'https://duoduo.taotoken.net/v1/'
  const wechatCliPath = db.getSetting('wechatCliPath') || ''
  const tokenUserId = db.getSetting('tokenUserId') || ''
  const userToken = db.getSetting('userToken') || ''
  return { apiKey, model, apiBase, wechatCliPath, tokenUserId, userToken }
}

export function registerIpcHandlers() {
  // === WeChat CLI ===
  ipcMain.handle('get-group-sessions', async () => {
    return wechatCli.getGroupSessions()
  })

  ipcMain.handle('get-history', async (_e, chatName: string, startTime?: string, endTime?: string, limit?: number) => {
    console.log(`[get-history] chat=${chatName}, start=${startTime}, end=${endTime}, limit=${limit}`)
    const result = wechatCli.getHistory(chatName, startTime, endTime, limit)
    const msgs = Array.isArray(result) ? result : (result as any).messages || []
    console.log(`[get-history] returned ${msgs.length} messages, first=${msgs[0]?.time || 'none'}, last=${msgs[msgs.length-1]?.time || 'none'}`)
    return result
  })

  ipcMain.handle('search-messages', async (_e, keyword: string, chatName?: string) => {
    return wechatCli.searchMessages(keyword, chatName)
  })

  ipcMain.handle('get-stats', async (_e, chatName: string, startTime?: string, endTime?: string) => {
    return wechatCli.getStats(chatName, startTime, endTime)
  })

  ipcMain.handle('get-members', async (_e, chatName: string) => {
    return wechatCli.getMembers(chatName)
  })

  // === LLM Analysis ===
  ipcMain.handle('analyze-messages', async (_e, messages: string, prompt: string) => {
    const { apiKey, model, apiBase, tokenUserId, userToken } = getSettings()
    if (!apiKey) throw new Error('请先配置 API Key')
    return analyzeMessages(messages, prompt, apiKey, model, apiBase, tokenUserId, userToken)
  })

  ipcMain.handle('generate-daily-report', async (_e, chatName: string, date?: string) => {
    const { apiKey, model, apiBase, tokenUserId, userToken } = getSettings()
    if (!apiKey) throw new Error('请先配置 API Key')

    const reportDate = date || new Date().toISOString().split('T')[0]
    const messages = wechatCli.getHistory(chatName, `${reportDate} 00:00`, `${reportDate} 23:59`, 500)
    const messageText = messages
      .map(m => `[${m.time}] ${m.sender}: ${m.content}`)
      .join('\n')

    const result = await generateDailyReport(messageText, apiKey, model, apiBase, tokenUserId, userToken)
    db.insertDailyReport(chatName, reportDate, result)
    return result
  })

  // === Monitor (per-group) ===
  ipcMain.handle('start-group-monitor', async (_e, config: { groupName: string; prompt: string; intervalMs: number }) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) throw new Error('No main window')
    startGroupMonitor(config, mainWindow)
    db.saveMonitorConfig(config.groupName, { prompt: config.prompt, intervalMs: config.intervalMs })
    db.setMonitorEnabled(config.groupName, true)
    return { success: true }
  })

  ipcMain.handle('stop-group-monitor', async (_e, groupName: string) => {
    stopGroupMonitor(groupName)
    db.setMonitorEnabled(groupName, false)
    return { success: true }
  })

  ipcMain.handle('stop-all-monitors', async () => {
    stopAllMonitors()
    return { success: true }
  })

  ipcMain.handle('get-group-monitor-status', async (_e, groupName: string) => {
    return getGroupMonitorStatus(groupName)
  })

  ipcMain.handle('get-all-monitor-statuses', async () => {
    return getAllMonitorStatuses()
  })

  ipcMain.handle('get-monitor-results', async (_e, limit?: number) => {
    return db.getMonitorResults(limit)
  })

  ipcMain.handle('get-monitor-batches', async (_e, groupName?: string, limit?: number) => {
    return db.getMonitorBatches(limit, groupName)
  })

  ipcMain.handle('save-monitor-config', async (_e, groupName: string, config: { prompt: string; intervalMs: number }) => {
    db.saveMonitorConfig(groupName, config)
    return { success: true }
  })

  ipcMain.handle('get-monitor-config', async (_e, groupName: string) => {
    return db.getMonitorConfig(groupName)
  })

  ipcMain.handle('get-all-monitor-configs', async () => {
    return db.getAllMonitorConfigs()
  })

  // === Settings ===
  ipcMain.handle('save-settings', async (_e, settings: { apiKey: string; model: string; apiBase: string; wechatCliPath?: string; tokenUserId?: string; userToken?: string }) => {
    if (settings.apiKey) db.setSetting('apiKey', settings.apiKey)
    if (settings.model) db.setSetting('model', settings.model)
    if (settings.apiBase) db.setSetting('apiBase', settings.apiBase)
    if (settings.wechatCliPath) {
      db.setSetting('wechatCliPath', settings.wechatCliPath)
      wechatCli.setWechatCliPath(settings.wechatCliPath)
    }
    if (settings.tokenUserId) db.setSetting('tokenUserId', settings.tokenUserId)
    if (settings.userToken) db.setSetting('userToken', settings.userToken)
    return { success: true }
  })

  ipcMain.handle('get-settings', async () => {
    return getSettings()
  })

  // === WeChat CLI Path ===
  ipcMain.handle('check-wechat-cli', async () => {
    try {
      // 尝试运行 wechat-cli --help 检测是否可用
      const result = wechatCli.getGroupSessions()
      return { available: true, message: 'wechat-cli 已就绪' }
    } catch (error: any) {
      return { available: false, message: error.message }
    }
  })

  // === Analysis History ===
  ipcMain.handle('save-analysis', async (_e, data: { chatNames: string[]; prompt: string; result: string; messageCount: number; timeRange?: string }) => {
    db.insertAnalysis(data)
    return { success: true }
  })

  ipcMain.handle('get-analysis-history', async (_e, limit?: number) => {
    return db.getAnalysisHistory(limit)
  })

  ipcMain.handle('get-analysis-by-id', async (_e, id: number) => {
    return db.getAnalysisById(id)
  })

  // === Custom Templates ===
  ipcMain.handle('get-custom-templates', async () => {
    const raw = db.getSetting('customTemplates')
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  })

  ipcMain.handle('save-custom-templates', async (_e, templates: any[]) => {
    db.setSetting('customTemplates', JSON.stringify(templates))
    return { success: true }
  })

  // === Save Image (Markdown → long PNG via hidden window) ===
  ipcMain.handle('save-image', async (_e, data: { title: string; prompt: string; content: string; timestamp: number; groupName: string }) => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) return { saved: false }

    const { title, prompt, content, timestamp, groupName } = data
    const htmlBody = await marked(content || '')
    const timeStr = new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })

    const pageHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
    padding: 40px;
    background: #fff;
    color: #1d1d1f;
    line-height: 1.6;
  }
  .header {
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 20px;
  }
  .header h1 { font-size: 20px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; }
  .header .meta { font-size: 13px; color: #86868b; }
  .header .meta span { margin-right: 16px; }
  .prompt {
    font-size: 14px; color: #86868b; background: #f5f5f7; padding: 10px 14px;
    border-radius: 8px; margin-bottom: 24px;
  }
  .prompt strong { color: #1d1d1f; }
  .content { font-size: 15px; color: #1d1d1f; }
  .content h1 { font-size: 20px; font-weight: 600; padding-bottom: 10px; border-bottom: 1px solid #e5e5e5; margin: 24px 0 12px; }
  .content h2 { font-size: 17px; font-weight: 600; margin: 20px 0 8px; }
  .content h3 { font-size: 15px; font-weight: 600; margin: 16px 0 6px; }
  .content p { margin: 8px 0; }
  .content ul, .content ol { padding-left: 24px; margin: 8px 0; }
  .content li { margin: 4px 0; }
  .content blockquote {
    border-left: 3px solid #007AFF; padding: 8px 12px; margin: 12px 0;
    background: #f0f5ff; border-radius: 0 8px 8px 0; color: #555;
  }
  .content code {
    background: #f5f5f7; color: #007AFF; padding: 2px 6px; border-radius: 4px;
    font-size: 13px; font-family: "SF Mono", Menlo, monospace;
  }
  .content pre {
    background: #1d1d1f; color: #f5f5f7; padding: 16px; border-radius: 10px;
    font-size: 13px; overflow-x: auto; margin: 12px 0;
    font-family: "SF Mono", Menlo, monospace;
  }
  .content table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px; }
  .content th { background: #f5f5f7; padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
  .content td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
  .content hr { border: none; border-top: 1px solid #e5e5e5; margin: 20px 0; }
  .content strong { font-weight: 600; }
  .watermark { text-align: right; font-size: 12px; color: #c0c0c0; margin-top: 30px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
</style>
</head><body>
  <div class="header">
    <h1>${title || groupName}</h1>
    <div class="meta">
      <span>${groupName}</span>
      <span>${timeStr}</span>
    </div>
  </div>
  ${prompt ? `<div class="prompt"><strong>指令：</strong>${prompt}</div>` : ''}
  <div class="content">${htmlBody}</div>
  <div class="watermark">群小猴</div>
</body></html>`

    // Create hidden window
    const offscreen = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    await offscreen.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(pageHtml)}`)
    await new Promise(r => setTimeout(r, 300))

    // Get full page height and resize
    const fullHeight = await offscreen.webContents.executeJavaScript('document.documentElement.scrollHeight')
    offscreen.setBounds({ width: 800, height: Math.min(fullHeight + 40, 16000) })
    await new Promise(r => setTimeout(r, 200))

    // Capture full page
    const image = await offscreen.webContents.capturePage()
    offscreen.close()

    // Save dialog
    const defaultName = `${groupName}-${timeStr.replace(/[\/\s:]/g, '-')}.png`
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'PNG 图片', extensions: ['png'] }]
    })
    if (canceled || !filePath) return { saved: false }

    fs.writeFileSync(filePath, image.toPNG())
    return { saved: true, filePath }
  })

}