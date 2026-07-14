import { useEffect } from 'react'
import { useMonitorStore, MonitorBatch } from '../stores/monitor'
import { useGroupsStore } from '../stores/groups'

export default function GroupMonitor() {
  const {
    isRunning, groupNames, monitorPrompt, intervalMs,
    setGroupNames, setMonitorPrompt, setIntervalMs, addBatch,
    start, stop, fetchStatus, fetchResults
  } = useMonitorStore()
  const { groups } = useGroupsStore()

  useEffect(() => {
    fetchStatus()
    fetchResults()
    window.api.onMonitorBatch((batch: MonitorBatch) => addBatch(batch))
    return () => { window.api.removeMonitorBatchListener() }
  }, [])

  const handleToggleGroup = (name: string) => {
    if (groupNames.includes(name)) {
      setGroupNames(groupNames.filter(n => n !== name))
    } else {
      setGroupNames([...groupNames, name])
    }
  }

  const canStart = groupNames.length > 0 && monitorPrompt.trim().length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col min-h-0">
        {/* Monitor Prompt */}
        <div>
          <label className="text-[12px] text-gray-500 font-medium block mb-1.5">监控条件</label>
          <textarea
            className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none placeholder:text-gray-300 leading-relaxed"
            rows={6}
            placeholder="输入监控条件，例如：&#10;关注任何提到产品发布计划的消息...&#10;找出讨论技术方案的关键发言"
            value={monitorPrompt}
            onChange={(e) => setMonitorPrompt(e.target.value)}
          />
        </div>

        {/* Interval */}
        <div>
          <label className="text-[12px] text-gray-500 font-medium block mb-1.5">轮询间隔</label>
          <select
            className="w-full px-3 py-2 text-[12px] border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-medium"
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
          >
            <option value={30000}>30 秒</option>
            <option value={60000}>1 分钟</option>
            <option value={300000}>5 分钟</option>
            <option value={600000}>10 分钟</option>
            <option value={1800000}>30 分钟</option>
          </select>
        </div>

        {/* Group selector - fill remaining space */}
        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-[12px] text-gray-500 font-medium block mb-1.5">监控群聊</label>
          <div className="border border-gray-200 rounded-xl overflow-hidden flex-1">
            <div className="h-full overflow-y-auto">
              {groups.map((g) => (
                <label key={g.username} className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                  <input type="checkbox" checked={groupNames.includes(g.chat)} onChange={() => handleToggleGroup(g.chat)} className="rounded text-indigo-500" />
                  <span className="truncate text-[12px] text-gray-600">{g.chat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="p-4 border-t border-gray-100">
        <button
          className={`w-full py-3 text-[13px] rounded-xl font-medium transition-all ${
            isRunning
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-200/50'
              : canStart
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-200/50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          onClick={isRunning ? stop : start}
          disabled={!isRunning && !canStart}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              停止监控
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              开始监控
            </span>
          )}
        </button>
      </div>
    </div>
  )
}