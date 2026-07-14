import { useState, useEffect } from 'react'
import { useMonitorStore, MonitorBatch } from '../stores/monitor'

interface Props {
  groupName: string
}

export default function MonitorResults({ groupName }: Props) {
  const { results, fetchResults, addBatch } = useMonitorStore()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filteredResults = results.filter((b: MonitorBatch) => !b.chatName || b.chatName === groupName)

  useEffect(() => {
    fetchResults(groupName)

    window.api.onMonitorBatch((batch: MonitorBatch) => {
      if (!batch.chatName || batch.chatName === groupName) {
        addBatch(batch)
      }
    })

    return () => {
      window.api.removeMonitorBatchListener()
    }
  }, [groupName])

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">监控结果</div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-xs">暂无匹配结果</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {filteredResults.map((batch: MonitorBatch) => (
              <div key={batch.id} className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-all"
                  onClick={() => toggleExpand(batch.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded-full font-medium">
                        {batch.matchCount} 条匹配
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(batch.timestamp * 1000).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedId === batch.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {batch.matches.length > 0 && (
                    <div className="mt-1.5 text-[11px] text-gray-500 line-clamp-1">
                      {batch.matches[0].analysis}
                    </div>
                  )}
                </div>

                {expandedId === batch.id && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {batch.matches.map((match, idx) => (
                      <div key={idx} className="p-3 border-b border-gray-100 last:border-0">
                        <div className="text-[11px] font-medium text-gray-700 mb-1">{match.sender}</div>
                        <div className="text-[12px] text-gray-600 leading-relaxed mb-1.5">{match.content}</div>
                        <div className="px-2.5 py-1.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <div className="text-[10px] text-indigo-600 font-medium mb-0.5">AI 分析</div>
                          <div className="text-[11px] text-gray-600">{match.analysis}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}