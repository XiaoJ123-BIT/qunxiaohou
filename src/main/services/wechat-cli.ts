import { execSync } from 'child_process'
import { join } from 'path'
import * as fs from 'fs'

// 延迟导入 db，避免初始化时序问题
let dbModule: typeof import('./db') | null = null
function getDb() {
  if (!dbModule) {
    dbModule = require('./db')
  }
  return dbModule
}

// 验证 CLI 是否可用
function testCliPath(path: string): boolean {
  if (!fs.existsSync(path)) return false
  try {
    if (process.platform === 'win32') {
      execSync(`"${path}" --help`, { encoding: 'utf-8', timeout: 10000, shell: 'cmd.exe' })
    } else {
      execSync(`"${path}" --help`, { encoding: 'utf-8', timeout: 10000, env: { ...process.env, HOME: process.env.HOME || '/Users/' + process.env.USER } })
    }
    return true
  } catch (e) {
    console.warn(`[群小猴] testCliPath failed for ${path}:`, (e as Error).message)
    // 即使 --help 失败，只要文件存在且可执行，也尝试使用
    try {
      fs.accessSync(path, fs.constants.X_OK)
      return true
    } catch {
      return false
    }
  }
}

let cachedPath: string | null = null
let autoInstallAttempted = false

function getWechatCliPath(): string {
  // 1. 缓存优先
  if (cachedPath) return cachedPath

  // 2. 从数据库读取用户保存的路径
  try {
    const { getSetting } = getDb()
    const savedPath = getSetting('wechatCliPath')
    if (savedPath && testCliPath(savedPath)) {
      cachedPath = savedPath
      return cachedPath
    }
  } catch {
    // 数据库未初始化，跳过
  }

  // 3. 环境变量
  if (process.env.WECHAT_CLI_PATH && testCliPath(process.env.WECHAT_CLI_PATH)) {
    cachedPath = process.env.WECHAT_CLI_PATH
    return cachedPath
  }

  // 4. macOS/Linux 默认路径
  if (process.platform !== 'win32') {
    const home = process.env.HOME || process.env.USERPROFILE
    if (home) {
      const defaultPaths = [
        join(home, 'wechat-cli', '.venv', 'bin', 'wechat-cli'),
        join(home, '.local', 'bin', 'wechat-cli'),
        join(home, 'Library', 'Python', '3.11', 'bin', 'wechat-cli'),
        join(home, 'Library', 'Python', '3.12', 'bin', 'wechat-cli'),
        join(home, 'Library', 'Python', '3.13', 'bin', 'wechat-cli'),
        '/usr/local/bin/wechat-cli',
        '/opt/homebrew/bin/wechat-cli',
        '/usr/bin/wechat-cli',
      ]
      console.log(`[群小猴] Searching wechat-cli, HOME=${home}`)
      for (const p of defaultPaths) {
        console.log(`[群小猴] Checking: ${p}, exists=${fs.existsSync(p)}`)
        if (testCliPath(p)) {
          console.log(`[群小猴] Found wechat-cli at: ${p}`)
          cachedPath = p
          return cachedPath
        }
      }
    } else {
      console.warn('[群小猴] HOME not set, cannot search default paths')
    }
  }

  // 5. Windows 默认路径
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA
    if (localAppData) {
      const defaultPaths = [
        join(localAppData, 'qunxiaohou', 'python', 'Scripts', 'wechat-cli.exe'),
        join(localAppData, 'npm', 'wechat-cli.cmd'),
        join(localAppData, 'Programs', 'Python', 'Python313', 'Scripts', 'wechat-cli.exe'),
        join(localAppData, 'Programs', 'Python', 'Python312', 'Scripts', 'wechat-cli.exe'),
        join(localAppData, 'Programs', 'Python', 'Python311', 'Scripts', 'wechat-cli.exe'),
        join(localAppData, 'Programs', 'Python', 'Python310', 'Scripts', 'wechat-cli.exe'),
        join(localAppData, 'Programs', 'Python', 'Python39', 'Scripts', 'wechat-cli.exe'),
      ]
      for (const p of defaultPaths) {
        if (testCliPath(p)) {
          cachedPath = p
          return cachedPath
        }
      }
    }
  }

  // 6. 检查系统 PATH
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which'
    const pathResult = execSync(`${whichCmd} wechat-cli`, { encoding: 'utf-8', timeout: 5000 }).trim().split('\n')[0]
    if (pathResult && testCliPath(pathResult)) {
      cachedPath = pathResult
      return cachedPath
    }
  } catch {
    // 不在 PATH 中
  }

  // 7. Windows 自动安装
  if (process.platform === 'win32' && !autoInstallAttempted) {
    autoInstallAttempted = true
    const installedPath = autoInstallWechatCli()
    if (installedPath) {
      cachedPath = installedPath
      return cachedPath
    }
  }

  // 都检测不到，返回默认命令名
  return 'wechat-cli'
}

function autoInstallWechatCli(): string | null {
  const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA
  if (!localAppData) return null

  const installDir = join(localAppData, 'qunxiaohou')
  const pythonDir = join(installDir, 'python')
  const wechatCliPath = join(pythonDir, 'Scripts', 'wechat-cli.exe')

  // Already installed
  if (testCliPath(wechatCliPath)) return wechatCliPath

  console.log('[群小猴] wechat-cli not found, auto-installing...')

  // Try pip first if Python exists
  const pythonCmds = ['python', 'python3', 'py']
  for (const cmd of pythonCmds) {
    try {
      execSync(`${cmd} --version`, { encoding: 'utf-8', timeout: 3000 })
      console.log(`[群小猴] Found ${cmd}, installing wechat-cli via pip...`)
      execSync(`${cmd} -m pip install wechat-cli --quiet`, { encoding: 'utf-8', timeout: 120000 })
      // Try to find installed path
      try {
        const whereResult = execSync(`where wechat-cli`, { encoding: 'utf-8', timeout: 3000 }).trim().split('\n')[0].trim()
        if (testCliPath(whereResult)) {
          console.log('[群小猴] wechat-cli installed via pip:', whereResult)
          return whereResult
        }
      } catch {}
    } catch {
      continue
    }
  }

  // Download portable Python if pip failed
  console.log('[群小猴] No Python found, downloading portable Python...')
  try {
    fs.mkdirSync(pythonDir, { recursive: true })

    const pythonUrl = 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip'
    const zipPath = join(installDir, 'python.zip')

    console.log('[群小猴] Downloading Python 3.11...')
    execSync(
      `powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${pythonUrl}' -OutFile '${zipPath}'"`,
      { encoding: 'utf-8', timeout: 120000 }
    )

    if (!fs.existsSync(zipPath)) {
      console.error('[群小猴] Download failed: zip not found')
      return null
    }

    console.log('[群小猴] Extracting Python...')
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${pythonDir}' -Force"`,
      { encoding: 'utf-8', timeout: 30000 }
    )
    try { fs.unlinkSync(zipPath) } catch {}

    // Enable pip in embedded Python
    const pthFile = join(pythonDir, 'python311._pth')
    fs.writeFileSync(pthFile, [
      'python311.zip',
      '.',
      'Lib',
      'Lib\\\\site-packages',
      '',
      'import site'
    ].join('\n'))

    // Download get-pip.py
    console.log('[群小猴] Installing pip...')
    const getPipPath = join(pythonDir, 'get-pip.py')
    execSync(
      `powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '${getPipPath}'"`,
      { encoding: 'utf-8', timeout: 60000 }
    )
    const pythonExe = join(pythonDir, 'python.exe')
    execSync(`"${pythonExe}" "${getPipPath}" --quiet`, { encoding: 'utf-8', timeout: 60000 })
    try { fs.unlinkSync(getPipPath) } catch {}

    // Install wechat-cli
    console.log('[群小猴] Installing wechat-cli...')
    execSync(`"${pythonExe}" -m pip install wechat-cli --quiet`, { encoding: 'utf-8', timeout: 120000 })

    if (testCliPath(wechatCliPath)) {
      console.log('[群小猴] wechat-cli installed successfully:', wechatCliPath)
      return wechatCliPath
    } else {
      console.error('[群小猴] Installation completed but wechat-cli not found at:', wechatCliPath)
      // List what's in Scripts dir for debugging
      try {
        const scriptsDir = join(pythonDir, 'Scripts')
        if (fs.existsSync(scriptsDir)) {
          console.log('[群小猴] Scripts dir contents:', fs.readdirSync(scriptsDir).join(', '))
        }
      } catch {}
    }
  } catch (err) {
    console.error('[群小猴] Auto-install failed:', err)
  }

  return null
}

function getWechatCli(): string {
  if (!cachedPath) {
    return getWechatCliPath()
  }
  return cachedPath
}

// 允许从外部设置路径（用于设置页面）
export function setWechatCliPath(path: string) {
  cachedPath = path
}

export interface Session {
  chat: string
  username: string
  is_group: boolean
  unread: number
  last_message: string
  msg_type: string
  sender: string
  timestamp: number
  time: string
}

export interface Message {
  chat: string
  sender: string
  content: string
  msg_type: string
  timestamp: number
  time: string
}

function runCli(args: string): string {
  const cliPath = getWechatCli()
  try {
    if (process.platform === 'win32') {
      return execSync(`"${cliPath}" ${args}`, {
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 50 * 1024 * 1024,
        shell: 'cmd.exe'
      })
    }
    return execSync(`"${cliPath}" ${args}`, {
      encoding: 'utf-8',
      timeout: 30000,
      maxBuffer: 50 * 1024 * 1024,
      env: { ...process.env, HOME: process.env.HOME || '/Users/' + process.env.USER }
    })
  } catch (error: any) {
    const errMsg = error.message || ''
    // Check if it's a "not found" error
    if (errMsg.includes('not found') || errMsg.includes('ENOENT') || errMsg.includes('找不到') || errMsg.includes('系统找不到')) {
      throw new Error(`未找到 wechat-cli，请先安装：

方法1 - 如果已安装 Python：
  打开命令提示符，运行: pip install wechat-cli

方法2 - 如果没有 Python：
  1. 访问 https://www.python.org/downloads/ 下载安装 Python
  2. 安装后运行: pip install wechat-cli

安装完成后重启群小猴即可。

注意：请确保微信正在运行。`)
    }
    console.error('wechat-cli error:', errMsg)
    throw new Error(`wechat-cli 调用失败: ${errMsg}`)
  }
}

export function getGroupSessions(): Session[] {
  const output = runCli('sessions --format json --limit 200')
  return JSON.parse(output)
}

export function getHistory(
  chatName: string,
  startTime?: string,
  endTime?: string,
  limit?: number
): Message[] {
  const args = [`history "${chatName.replace(/"/g, '\\"')}" --format json`]
  if (startTime) args.push(`--start-time "${startTime}"`)
  if (endTime) args.push(`--end-time "${endTime}"`)
  if (limit) args.push(`--limit ${limit}`)
  const output = runCli(args.join(' '))
  const data = JSON.parse(output)
  const rawMessages = data.messages || data || []

  // wechat-cli returns messages as strings like "[2026-04-13 14:20] sender: content"
  // Parse them into Message objects
  if (rawMessages.length > 0 && typeof rawMessages[0] === 'string') {
    return rawMessages.map((line: string) => {
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]\s+(.+?):\s*([\s\S]*)$/)
      if (match) {
        return { chat: chatName, sender: match[2], content: match[3], msg_type: 'text', timestamp: 0, time: match[1] }
      }
      return { chat: chatName, sender: '', content: line, msg_type: 'text', timestamp: 0, time: '' }
    })
  }

  return rawMessages
}

export function searchMessages(keyword: string, chatName?: string): Message[] {
  const args = [`search "${keyword.replace(/"/g, '\\"')}" --format json`]
  if (chatName) args.push(`--chat "${chatName.replace(/"/g, '\\"')}"`)
  const output = runCli(args.join(' '))
  return JSON.parse(output)
}

export function getStats(chatName: string, startTime?: string, endTime?: string): any {
  const args = [`stats "${chatName.replace(/"/g, '\\"')}" --format json`]
  if (startTime) args.push(`--start-time "${startTime}"`)
  if (endTime) args.push(`--end-time "${endTime}"`)
  const output = runCli(args.join(' '))
  return JSON.parse(output)
}

export function getMembers(chatName: string): any[] {
  const output = runCli(`members "${chatName.replace(/"/g, '\\"')}"`)
  return JSON.parse(output)
}

export function getNewMessages(): any[] {
  const output = runCli('new-messages --format json')
  try {
    return JSON.parse(output)
  } catch {
    return []
  }
}