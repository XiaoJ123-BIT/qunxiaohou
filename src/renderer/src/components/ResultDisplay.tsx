import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAnalysisStore } from '../stores/analysis'

type ResultTab = 'current' | 'history'

export default function ResultDisplay() {
  const { result, analyzing, history, historyLoading, loadHistory, loadHistoryItem } = useAnalysisStore()
  const [activeTab, setActiveTab] = useState<ResultTab>('current')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleHistoryClick = async (id: number) => {
    await loadHistoryItem(id)
    setActiveTab('current')
  }

  // Custom components for ReactMarkdown
  const components = {
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4 pb-2 border-b border-gray-100">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold text-gray-700 mt-5 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-lg font-medium text-gray-600 mt-4 mb-2 text-indigo-600">
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-600 leading-relaxed mb-3">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-2 mb-4 ml-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 mb-4 ml-1 list-decimal">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="flex items-start gap-2 text-gray-600">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-indigo-200 bg-indigo-50/50 pl-4 py-2 pr-3 my-4 rounded-r-lg">
        {children}
      </blockquote>
    ),
    code: ({ children, inline }: any) => (
      inline ? (
        <code className="px-1.5 py-0.5 bg-gray-100 text-indigo-600 rounded text-[12px] font-mono">
          {children}
        </code>
      ) : (
        <pre className="bg-gray-50 text-gray-700 border border-gray-100 p-4 rounded-xl overflow-x-auto my-4 text-[13px] font-mono leading-relaxed">
          <code>{children}</code>
        </pre>
      )
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-800">{children}</strong>
    ),
    a: ({ href, children }: any) => (
      <a href={href} className="text-indigo-600 hover:text-indigo-700 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    hr: () => <hr className="border-gray-100 my-6" />,
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-[13px] border-collapse rounded-lg">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-indigo-50/80">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="border-b border-gray-100 last:border-0">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border border-gray-200/50">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-gray-600 border border-gray-200/50">{children}</td>
    ),
  }

  return (
    <div className="flex flex-col h-full bg-white min-h-0">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
        <div className="flex gap-2">
          <button
            className={`px-4 py-1.5 text-[12px] rounded-lg font-medium transition-all ${
              activeTab === 'current'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('current')}
          >
            当前结果
          </button>
          <button
            className={`px-4 py-1.5 text-[12px] rounded-lg font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => {
              setActiveTab('history')
              loadHistory()
            }}
          >
            历史记录
          </button>
        </div>

        <div className="flex gap-2">
          {activeTab === 'current' && result && (
            <>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                onClick={handleCopy}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? '已复制' : '复制'}
              </button>
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                onClick={handleExport}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出 .md
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content - single shared container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'current' && (
          <div className="p-6">
            {analyzing && (
              <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)] text-gray-400 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                  <svg className="animate-spin h-8 w-8 text-indigo-500 relative" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <span className="text-sm">AI 正在分析中...</span>
              </div>
            )}
            {!analyzing && !result && (
              <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)] text-gray-300 gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-sm text-gray-500">分析结果将在此展示</span>
                  <p className="text-xs text-gray-300 mt-1">选择群聊并点击开始分析</p>
                </div>
              </div>
            )}
            {!analyzing && result && (
              <div className="max-w-4xl mx-auto">
                <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                  {result}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 h-full">
            {historyLoading && (
              <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[13px]">加载中...</span>
              </div>
            )}
            {!historyLoading && history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-sm text-gray-500">暂无历史记录</span>
                  <p className="text-xs text-gray-300 mt-1">分析后的结果会自动保存</p>
                </div>
              </div>
            )}
            {!historyLoading && history.length > 0 && (
              <div className="grid gap-3">
                {history.map((item: any) => {
                  const chatNames = (() => {
                    try { return Array.isArray(item.chat_names) ? item.chat_names : JSON.parse(item.chat_names) }
                    catch { return [item.chat_names] }
                  })()
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group"
                      onClick={() => handleHistoryClick(item.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                            {chatNames.length === 1 ? chatNames[0] : `${chatNames.length}个群聊`}
                          </span>
                          {item.time_range && (
                            <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded-lg">{item.time_range}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(item.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="text-[13px] text-gray-700 font-medium mb-1 line-clamp-1">{item.prompt || '(无 prompt)'}</div>
                      <div className="text-[12px] text-gray-400 line-clamp-2">{item.result?.substring(0, 120)}...</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}