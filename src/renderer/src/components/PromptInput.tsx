import { useState, useEffect, useRef } from 'react'
import { useAnalysisStore, TIME_RANGE_OPTIONS } from '../stores/analysis'
import { useGroupsStore } from '../stores/groups'
import { useMonitorStore } from '../stores/monitor'

export default function PromptInput() {
  const { prompt, setPrompt, analyzing, analyze, currentGroupName } = useAnalysisStore()
  const { selectedGroup } = useGroupsStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const templates = [
    { label: '总结概要', prompt: '请总结这段群聊讨论的主要话题和结论', color: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700' },
    { label: '提取待办', prompt: '请从这段群聊中提取所有待办事项、行动项，并标注负责人', color: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' },
    { label: '提取链接', prompt: '请提取这段群聊中分享的所有链接、文件和资源', color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' },
    { label: '关键发言', prompt: '请找出这段群聊中最有价值的发言，按重要性排序', color: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' },
    { label: '生成日报', prompt: '请根据以下群聊记录生成今日日报，包含：讨论话题总结、活跃成员及核心观点、关键决策、待办事项、高频问题', color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' },
    { label: '梳理问题', prompt: '请梳理这段群聊中提到的所有问题、疑问和困惑，按重要性和紧急程度分类', color: 'from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700' },
  ]

  const templateIcons: Record<string, JSX.Element> = {
    '总结概要': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    '提取待办': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    '提取链接': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    '关键发言': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    '生成日报': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    '梳理问题': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  }

  const canSend = prompt.trim().length > 0 && !analyzing && !!selectedGroup

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 300) + 'px'
    }
  }, [prompt])

  const handleSend = () => {
    if (!canSend || !selectedGroup) return
    analyze([selectedGroup])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 快捷操作 - 紧凑网格 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {templates.map((t) => (
          <button
            key={t.label}
            className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-[11px] font-medium rounded-xl transition-all duration-300 shadow-sm bg-gradient-to-r ${t.color} text-white hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
            onClick={() => setPrompt(t.prompt)}
          >
            {templateIcons[t.label]}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 自定义输入 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300/60 transition-all duration-300">
          <textarea
            ref={textareaRef}
            className="flex-1 w-full px-4 py-3 text-[14px] bg-transparent focus:outline-none resize-none placeholder:text-slate-300 leading-relaxed"
            placeholder="输入自定义分析指令...&#10;例如：分析最近的产品讨论中大家最关心什么问题？&#10;&#10;快捷键：Cmd/Ctrl + Enter 发送"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* 发送按钮 */}
      <div className="mt-3">
        <button
          className={`w-full py-3 text-[14px] rounded-xl font-medium transition-all duration-300 cursor-pointer ${
            canSend
              ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-300/40 hover:-translate-y-0.5'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          onClick={handleSend}
          disabled={!canSend}
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI 正在分析...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              开始分析
            </span>
          )}
        </button>
      </div>
    </div>
  )
}