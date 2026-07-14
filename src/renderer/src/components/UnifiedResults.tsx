import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAnalysisStore } from '../stores/analysis'
import { useMonitorStore, MonitorBatch } from '../stores/monitor'
import { useSettingsStore } from '../stores/settings'

interface UnifiedItem {
  id: string
  type: 'analysis' | 'monitor'
  timestamp: number
  prompt: string
  content: string
  groupName: string
  extra?: string
}

const FILTER_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '3 天', value: '3d' },
  { label: '7 天', value: '7d' },
  { label: '30 天', value: '30d' },
]

function filterByTime(items: UnifiedItem[], range: string): UnifiedItem[] {
  if (range === 'all') return items
  const now = Date.now()
  const ranges: Record<string, number> = {
    'today': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }
  const cutoff = now - ranges[range]
  return items.filter(item => item.timestamp >= cutoff)
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatExportContent(item: UnifiedItem): string {
  return `# ${item.groupName} - ${formatDate(item.timestamp)}\n\n**指令**: ${item.prompt || '无'}\n\n---\n\n${item.content}\n`
}

const MD = {
  h1: ({ children }: any) => <h1 className="text-[17px] font-semibold text-[#1d1d1f] pb-2 mb-3 border-b border-black/[0.06]">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-[15px] font-semibold text-[#1d1d1f] mt-4 mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-[13px] font-semibold text-[#1d1d1f] mt-3 mb-1">{children}</h3>,
  p: ({ children }: any) => <p className="text-[#1d1d1f] my-1.5 leading-[1.6]">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc list-inside pl-1.5 space-y-1 text-[#1d1d1f]">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside pl-1.5 space-y-1 text-[#1d1d1f]">{children}</ol>,
  li: ({ children }: any) => <li className="text-[#1d1d1f] leading-[1.5]">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-[#1d1d1f]">{children}</strong>,
  blockquote: ({ children }: any) => <blockquote className="border-l-[3px] border-[#007AFF] pl-3 py-1 my-2 bg-[#007AFF]/[0.03] text-[#86868b] rounded-r-lg">{children}</blockquote>,
  code: ({ className, children }: any) => {
    return !className
      ? <code className="bg-black/[0.05] text-[#007AFF] px-1 py-0.5 rounded-[4px] text-[12px] font-mono">{children}</code>
      : <code className="block bg-[#1d1d1f] text-[#f5f5f7] p-4 rounded-[10px] text-[12px] overflow-x-auto my-2">{children}</code>
  },
  hr: () => <hr className="border-black/[0.06] my-4" />,
  table: ({ children }: any) => <table className="min-w-full border border-black/[0.06] my-2 rounded-[8px] overflow-hidden text-[13px]">{children}</table>,
  th: ({ children }: any) => <th className="bg-black/[0.02] px-3 py-2 text-[12px] font-medium text-[#1d1d1f] border-b border-black/[0.06] text-left">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-2 text-[13px] text-[#1d1d1f] border-b border-black/[0.04]">{children}</td>,
}

export default function UnifiedResults() {
  const { result, analyzing, history, loadHistory } = useAnalysisStore()
  const { results, fetchResults, addBatch } = useMonitorStore()
  const [filterRange, setFilterRange] = useState('all')
  const [filterGroup, setFilterGroup] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [followUpId, setFollowUpId] = useState<string | null>(null)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [followUpResult, setFollowUpResult] = useState<Record<string, string>>({})
  const [exportingImageId, setExportingImageId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadHistory(); fetchResults()
    window.api.onMonitorBatch((batch: MonitorBatch) => { addBatch(batch) })
    return () => { window.api.removeMonitorBatchListener() }
  }, [])

  useEffect(() => {
    if (followUpId && inputRef.current) inputRef.current.focus()
  }, [followUpId])

  const merged: UnifiedItem[] = []

  for (const item of history) {
    const chatNames = (() => {
      try { return Array.isArray(item.chat_names) ? item.chat_names : JSON.parse(item.chat_names) }
      catch { return [item.chat_names] }
    })()
    merged.push({ id: `analysis-${item.id}`, type: 'analysis', timestamp: new Date(item.created_at + 'Z').getTime(), prompt: item.prompt || '', content: item.result || '', groupName: chatNames[0] || '未知群聊', extra: item.time_range })
  }

  for (const batch of results) {
    const chatName = batch.chatName || '未知群聊'
    let content = ''
    if (batch.matches.length === 1 && !batch.matches[0].sender) {
      content = batch.matches[0].content || ''
    } else if (batch.matches.length > 0) {
      content = batch.matches.map(m => m.sender ? `**${m.sender}**\n\n> ${m.content}` : m.content).join('\n\n---\n\n')
    }
    merged.push({ id: `monitor-${batch.id}`, type: 'monitor', timestamp: batch.timestamp * 1000, prompt: batch.prompt || '', content, groupName: chatName, extra: '定时监控' })
  }

  merged.sort((a, b) => b.timestamp - a.timestamp)
  const filtered = filterByTime(merged, filterRange).filter(item => !filterGroup || item.groupName === filterGroup)

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExport = (item: UnifiedItem) => {
    const filename = `${item.groupName}-${formatDate(item.timestamp).replace(/[\/\s:]/g, '-')}.md`
    const blob = new Blob([formatExportContent(item)], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }

  const handleImageExport = async (item: UnifiedItem) => {
    if (!item.content) return
    setExportingImageId(item.id)
    try {
      const res = await window.api.saveImage({
        title: item.groupName,
        prompt: item.prompt,
        content: item.content,
        timestamp: item.timestamp,
        groupName: item.groupName,
      })
      if (res && res.saved) return
    } catch (err: any) {
      alert('导出失败：' + err.message)
    } finally {
      setExportingImageId(null)
    }
  }

  const handleBatchExport = () => {
    if (filtered.length === 0) return
    const allContent = filtered.map(formatExportContent).join('\n\n---\n\n')
    const filename = `全部分析记录-${formatDate(Date.now()).replace(/[\/\s:]/g, '-')}.md`
    const blob = new Blob([allContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }

  const handleFollowUp = async (item: UnifiedItem) => {
    if (followUpId === item.id) { setFollowUpId(null); setFollowUpQuestion(''); return }
    setFollowUpId(item.id); setFollowUpQuestion(''); setFollowUpLoading(false)
  }

  const handleSendFollowUp = async (item: UnifiedItem) => {
    if (!followUpQuestion.trim() || followUpLoading) return
    setFollowUpLoading(true)
    try {
      const context = `以下是之前的分析结果：\n\n${item.content}\n\n---\n\n用户追问：${followUpQuestion}`
      const res = await window.api.analyzeMessages(context, followUpQuestion)
      setFollowUpResult(prev => ({ ...prev, [item.id]: res })); setFollowUpQuestion('')
    } catch (err: any) {
      if (err.message === 'INSUFFICIENT_BALANCE') {
        setFollowUpResult(prev => ({ ...prev, [item.id]: '余额不足，请先充值' }))
        useSettingsStore.getState().openTokenPay()
      } else {
        setFollowUpResult(prev => ({ ...prev, [item.id]: `追问失败：${err.message}` }))
      }
    } finally { setFollowUpLoading(false) }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar - Apple style */}
      <div className="px-5 py-3 border-b border-black/[0.06] bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-[#1d1d1f]">分析记录</span>
          <span className="text-[11px] text-[#86868b]">{filtered.length} 条</span>
          {filterGroup && (
            <button onClick={() => setFilterGroup(null)}
              className="flex items-center gap-1 px-2 py-[2px] bg-[#007AFF]/[0.08] text-[#007AFF] text-[11px] rounded-[5px] hover:bg-[#007AFF]/[0.15] transition-colors cursor-pointer">
              <span className="max-w-[120px] truncate">{filterGroup}</span>
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* macOS segmented filter */}
          <div className="flex bg-black/[0.04] rounded-[7px] p-[2px]">
            {FILTER_OPTIONS.map(opt => (
              <button key={opt.value} className={`px-2 py-[3px] text-[11px] rounded-[5px] transition-colors duration-150 cursor-pointer ${
                filterRange === opt.value ? 'bg-white text-[#1d1d1f] shadow-[0_0.5px_1px_rgba(0,0,0,0.06)]' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`} onClick={() => setFilterRange(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>

          <button onClick={handleBatchExport} disabled={filtered.length === 0}
            className="px-3 py-[5px] text-[12px] bg-[#007AFF] text-white rounded-[7px] hover:bg-[#0066D6] disabled:bg-black/[0.06] disabled:text-[#aeaeb2] disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer">
            导出
          </button>

          {analyzing && (
            <span className="flex items-center gap-1.5 text-[12px] text-[#007AFF]">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              分析中
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 bg-black/[0.03] rounded-[14px] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#aeaeb2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-[#86868b]">暂无分析记录</p>
            <p className="text-[12px] text-[#aeaeb2] mt-1">展开群聊并发起分析</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((item) => {
            const isFollowing = followUpId === item.id
            const hasFollowUp = !!followUpResult[item.id]

            return (
              <div key={item.id}>
                <div className="rounded-[12px] border border-black/[0.06] bg-white overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-black/[0.04] bg-black/[0.01]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-[2px] text-[10px] rounded-[5px] font-medium ${
                        item.type === 'monitor'
                          ? 'bg-[#FF9500]/[0.1] text-[#FF9500]'
                          : 'bg-[#007AFF]/[0.1] text-[#007AFF]'
                      }`}>
                        {item.type === 'monitor' ? '监控' : '分析'}
                      </span>
                      <span onClick={(e) => { e.stopPropagation(); setFilterGroup(filterGroup === item.groupName ? null : item.groupName) }}
                        className={`text-[13px] font-medium truncate max-w-[200px] cursor-pointer transition-colors ${
                          filterGroup === item.groupName ? 'text-[#007AFF]' : 'text-[#1d1d1f] hover:text-[#007AFF]'
                        }`}>{item.groupName}</span>
                      {item.extra && (
                        <span className="text-[10px] text-[#aeaeb2]">{item.extra}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#86868b]">{formatDate(item.timestamp)}</span>
                  </div>

                  {/* Prompt */}
                  {item.prompt && item.id !== 'current' && (
                    <div className="px-4 py-1.5 border-b border-black/[0.04] bg-black/[0.005]">
                      <span className="text-[12px] text-[#86868b]">
                        <span className="text-[#1d1d1f] font-medium">指令：</span>{item.prompt}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-5 py-4">
                    <div className="text-[13px] leading-[1.6]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{item.content}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-2 border-t border-black/[0.04] flex items-center gap-1">
                    <button onClick={() => handleCopy(item.id, item.content)}
                      className={`px-2.5 py-1 text-[12px] rounded-[6px] transition-colors duration-150 cursor-pointer ${
                        copiedId === item.id ? 'text-[#34C759]' : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.03]'
                      }`}>
                      {copiedId === item.id ? '已复制' : '复制'}
                    </button>
                    <button onClick={() => handleExport(item)}
                      className="px-2.5 py-1 text-[12px] text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.03] rounded-[6px] transition-colors duration-150 cursor-pointer">
                      导出
                    </button>
                    <button onClick={() => handleImageExport(item)} disabled={exportingImageId === item.id}
                      className="px-2.5 py-1 text-[12px] text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.03] rounded-[6px] transition-colors duration-150 cursor-pointer disabled:opacity-50">
                      {exportingImageId === item.id ? '生成中...' : '长图'}
                    </button>
                    <button onClick={() => handleFollowUp(item)}
                      className={`ml-auto px-3 py-1 text-[12px] font-medium rounded-[7px] transition-colors duration-150 cursor-pointer ${
                        isFollowing ? 'bg-black/[0.06] text-[#1d1d1f]' : 'bg-[#007AFF] text-white hover:bg-[#0066D6]'
                      }`}>
                      {isFollowing ? '收起' : '追问'}
                    </button>
                  </div>
                </div>

                {/* Follow-up */}
                {isFollowing && (
                  <div className="mt-2 rounded-[10px] border border-[#007AFF]/[0.12] bg-[#007AFF]/[0.02] p-3 space-y-2">
                    <div className="flex gap-2">
                      <input ref={inputRef} type="text" placeholder="输入追问问题..."
                        className="flex-1 px-3 py-[7px] text-[13px] bg-white rounded-[8px] border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/40 transition-colors duration-150"
                        value={followUpQuestion} onChange={(e) => setFollowUpQuestion(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendFollowUp(item) }} disabled={followUpLoading} />
                      <button onClick={() => handleSendFollowUp(item)} disabled={followUpLoading || !followUpQuestion.trim()}
                        className={`px-4 py-[7px] text-[13px] font-medium rounded-[8px] transition-colors duration-150 cursor-pointer ${
                          followUpLoading || !followUpQuestion.trim() ? 'bg-black/[0.06] text-[#aeaeb2] cursor-not-allowed' : 'bg-[#007AFF] text-white hover:bg-[#0066D6]'
                        }`}>
                        {followUpLoading ? (
                          <span className="flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>思考中</span>
                        ) : '发送'}
                      </button>
                    </div>
                    {followUpLoading && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[#007AFF]">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        正在思考...
                      </div>
                    )}
                    {hasFollowUp && (
                      <div className="mt-2 px-4 py-3 bg-white rounded-[10px] border border-black/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-[#007AFF] font-medium">追问结果</span>
                          <button onClick={() => setFollowUpResult(prev => ({ ...prev, [item.id]: '' }))} className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] cursor-pointer">清除</button>
                        </div>
                        <div className="text-[13px] leading-[1.6]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: MD.p, ul: MD.ul, ol: MD.ol, strong: MD.strong }}>{followUpResult[item.id]}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {hasFollowUp && !isFollowing && (
                  <div className="mt-2 px-4 py-2.5 rounded-[10px] border border-black/[0.04] bg-black/[0.01]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-[#007AFF] font-medium">追问结果</span>
                      <button onClick={() => setFollowUpResult(prev => ({ ...prev, [item.id]: '' }))} className="text-[11px] text-[#86868b] hover:text-[#1d1d1f] cursor-pointer">清除</button>
                    </div>
                    <div className="text-[13px] leading-[1.6]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: MD.p, ul: MD.ul, ol: MD.ol, strong: MD.strong }}>{followUpResult[item.id]}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}