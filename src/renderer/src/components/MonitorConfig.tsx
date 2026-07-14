import { useState } from 'react'
import { useMonitorStore } from '../stores/monitor'

interface Props {
  groupName: string
}

export default function MonitorConfig({ groupName }: Props) {
  const { getConfig, setPrompt, setIntervalMs, startOne, stopOne } = useMonitorStore()
  const config = getConfig(groupName)
  const [error, setError] = useState('')

  const handleToggle = async () => {
    setError('')
    try {
      if (config.isRunning) {
        await stopOne(groupName)
      } else {
        await startOne(groupName)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">消息监控</span>
        {config.isRunning && (
          <span className="flex items-center gap-1 text-[10px] text-green-600">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            监控中
          </span>
        )}
      </div>

      <textarea
        className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
        rows={3}
        placeholder="输入监控条件，如：关注任何提到产品发布计划的消息"
        value={config.prompt}
        onChange={(e) => setPrompt(groupName, e.target.value)}
        disabled={config.isRunning}
      />

      <div className="flex items-center gap-2">
        <select
          className="flex-1 px-2 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          value={config.intervalMs}
          onChange={(e) => setIntervalMs(groupName, parseInt(e.target.value))}
          disabled={config.isRunning}
        >
          <option value={30000}>30 秒</option>
          <option value={60000}>1 分钟</option>
          <option value={300000}>5 分钟</option>
          <option value={600000}>10 分钟</option>
          <option value={1800000}>30 分钟</option>
        </select>

        <button
          className={`px-4 py-1.5 text-[11px] rounded-lg font-medium transition-all ${
            config.isRunning
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-200'
          }`}
          onClick={handleToggle}
        >
          {config.isRunning ? '停止监控' : '启动监控'}
        </button>
      </div>

      {error && (
        <div className="text-[10px] text-red-500 bg-red-50 rounded-lg p-2">{error}</div>
      )}
    </div>
  )
}