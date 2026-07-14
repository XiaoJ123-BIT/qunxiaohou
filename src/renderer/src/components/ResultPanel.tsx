import { useState } from 'react'

interface Props {
  result: string
}

export default function ResultPanel({ result }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportMd = () => {
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-3">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="text-sm">分析结果将在此展示</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
        <span className="text-xs font-medium text-gray-500">分析结果</span>
        <div className="flex gap-1.5">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={handleExportMd}
            className="px-2.5 py-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            导出
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-sm max-w-none text-[13px] leading-relaxed whitespace-pre-wrap">{result}</div>
      </div>
    </div>
  )
}
