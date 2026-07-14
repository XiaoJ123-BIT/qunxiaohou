import { useState, useEffect } from 'react'
import { useGroupsStore, SessionFilter } from '../stores/groups'
import { useAnalysisStore, TIME_RANGE_OPTIONS } from '../stores/analysis'
import { useMonitorStore } from '../stores/monitor'

interface CustomTemplate {
  label: string
  prompt: string
  createdAt: number
}

const ANALYSIS_TEMPLATES = [
  { label: '总结概要', prompt: '请总结这段聊天讨论的主要话题和结论' },
  { label: '提取待办', prompt: '请从这段聊天中提取所有待办事项、行动项，并标注负责人' },
  { label: '提取链接', prompt: '请提取这段聊天中分享的所有链接、文件和资源' },
  { label: '关键发言', prompt: '请找出这段聊天中最有价值的发言，按重要性排序' },
  { label: '生成日报', prompt: '请根据以下聊天记录生成今日日报，包含：讨论话题总结、活跃成员及核心观点、关键决策、待办事项、高频问题' },
  { label: '梳理问题', prompt: '请梳理这段聊天中提到的所有问题、疑问和困惑，按重要性和紧急程度分类' },
]

const FILTER_TABS: { key: SessionFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'group', label: '群聊' },
  { key: 'personal', label: '个人' },
]

const INTERVAL_PRESETS = [
  { label: '30 分钟', value: 1800000 },
  { label: '60 分钟', value: 3600000 },
  { label: '90 分钟', value: 5400000 },
  { label: '120 分钟', value: 7200000 },
]

const MAX_CUSTOM_TEMPLATES = 10

export default function GroupList() {
  const { groups, selectedGroup, searchQuery, loading, error, sessionFilter, selectGroup, setSearchQuery, setSessionFilter, fetchGroups } = useGroupsStore()
  const { prompt, setPrompt, analyzing, analyze, selectedTimeRange, setSelectedTimeRange, customStart, setCustomStart, customEnd, setCustomEnd, fetchMessages } = useAnalysisStore()
  const { isGroupMonitored, getConfig, setPrompt: setMonitorPrompt, setIntervalMs, startOne, stopOne } = useMonitorStore()

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [monitorError, setMonitorError] = useState('')
  const [customInterval, setCustomInterval] = useState('')
  const [customIntervalGroup, setCustomIntervalGroup] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [showManageModal, setShowManageModal] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchGroups()
    setTimeout(() => setRefreshing(false), 600)
  }

  useEffect(() => {
    fetchGroups()
    loadCustomTemplates()
    const timer = setInterval(() => { fetchGroups() }, 60000)
    return () => clearInterval(timer)
  }, [])

  const loadCustomTemplates = async () => {
    try {
      const templates = await (window as any).api.getCustomTemplates()
      setCustomTemplates(templates)
    } catch {}
  }

  const allTemplatePrompts = [
    ...ANALYSIS_TEMPLATES.map(t => t.prompt),
    ...customTemplates.map(t => t.prompt),
  ]

  const isDuplicatePrompt = (p: string) => allTemplatePrompts.includes(p)

  const handleSaveTemplate = async () => {
    if (!prompt.trim() || !newTemplateName.trim()) return
    if (customTemplates.some(t => t.prompt === prompt.trim())) { setSaveError('该指令已存在于自定义模板中'); return }
    if (customTemplates.length >= MAX_CUSTOM_TEMPLATES) { setSaveError(`最多保存 ${MAX_CUSTOM_TEMPLATES} 个自定义模板`); return }

    const template: CustomTemplate = {
      label: newTemplateName.trim() || prompt.trim().slice(0, 10),
      prompt: prompt.trim(),
      createdAt: Date.now(),
    }
    const updated = [...customTemplates, template]
    await (window as any).api.saveCustomTemplates(updated)
    setCustomTemplates(updated)
    setShowSaveModal(false)
    setNewTemplateName('')
    setSaveError('')
  }

  const handleDeleteTemplate = async (index: number) => {
    const updated = customTemplates.filter((_, i) => i !== index)
    await (window as any).api.saveCustomTemplates(updated)
    setCustomTemplates(updated)
  }

  const filtered = groups
    .filter(g => {
      if (sessionFilter === 'group') return g.is_group
      if (sessionFilter === 'personal') return !g.is_group
      return true
    })
    .filter(g => g.chat.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleExpand = (chatName: string) => {
    if (expandedGroup === chatName) { setExpandedGroup(null) }
    else {
      setExpandedGroup(chatName); selectGroup(chatName); fetchMessages(chatName)
      const groupConfig = getConfig(chatName)
      setPrompt(groupConfig.prompt || '')
    }
  }

  const handlePromptChange = (chatName: string, value: string) => {
    setPrompt(value); setMonitorPrompt(chatName, value)
  }

  const isPresetInterval = (ms: number) => INTERVAL_PRESETS.some(p => p.value === ms)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-3 space-y-3">
        {/* Search + Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索"
              className="w-full pl-9 pr-3 py-[7px] text-[13px] bg-black/[0.04] rounded-[10px] focus:outline-none focus:bg-black/[0.06] focus:ring-2 focus:ring-[#007AFF]/20 transition-all duration-150 placeholder:text-[#86868b]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleRefresh}
            className="w-[34px] h-[34px] flex items-center justify-center bg-black/[0.04] rounded-[10px] hover:bg-black/[0.06] transition-colors duration-150 cursor-pointer flex-shrink-0"
          >
            <svg className={`w-3.5 h-3.5 text-[#86868b] ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* macOS segmented control */}
        <div className="flex bg-black/[0.04] rounded-[8px] p-[3px]">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSessionFilter(tab.key)}
              className={`flex-1 py-[5px] text-[12px] font-medium rounded-[6px] transition-all duration-150 cursor-pointer ${
                sessionFilter === tab.key
                  ? 'bg-white text-[#1d1d1f] shadow-[0_0.5px_2px_rgba(0,0,0,0.08)]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-[12px] text-[#FF3B30] bg-[#FF3B30]/[0.06] rounded-[10px] p-2.5">{error}</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !loading && (
          <div className="px-4 py-16 text-center">
            <span className="text-[13px] text-[#86868b]">暂无会话</span>
          </div>
        )}
        {filtered.map((group) => {
          const isSelected = selectedGroup === group.chat
          const isExpanded = expandedGroup === group.chat
          const isMonitored = isGroupMonitored(group.chat)
          const config = getConfig(group.chat)
          const canAnalyze = prompt.trim().length > 0 && !analyzing && !config.isRunning
          const canMonitor = config.prompt.trim().length > 0
          const isCustomActive = customIntervalGroup === group.chat

          return (
            <div
              key={group.username}
              className={`mx-2 my-[2px] rounded-[10px] transition-colors duration-150 ${
                isExpanded
                  ? 'bg-black/[0.04]'
                  : isSelected
                    ? 'bg-[#007AFF]/[0.08]'
                    : 'hover:bg-black/[0.02]'
              }`}
            >
              <div className="flex items-start gap-2.5 px-3 py-[10px] cursor-pointer" onClick={() => toggleExpand(group.chat)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-[#1d1d1f] truncate font-medium">{group.chat}</span>
                    {!group.is_group && (
                      <span className="px-1.5 py-0 text-[10px] text-[#86868b] bg-black/[0.04] rounded-[4px]">个人</span>
                    )}
                    {isMonitored && <span className="w-[6px] h-[6px] bg-[#34C759] rounded-full"></span>}
                  </div>
                  <div className="text-[11px] text-[#86868b] truncate mt-[2px]">{group.last_message}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-[11px] text-[#aeaeb2]">{group.time}</span>
                  <svg className={`w-3 h-3 text-[#aeaeb2] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-black/[0.06] px-3 pt-3 pb-3 space-y-2.5">
                  {/* Label: Analysis time range */}
                  <div className="text-[11px] text-[#86868b] font-medium">分析时间范围</div>
                  <div className="flex flex-wrap gap-1">
                    {TIME_RANGE_OPTIONS.map((option) => (
                      <button key={option.value} className={`px-2.5 py-[5px] text-[11px] rounded-[6px] transition-colors duration-150 cursor-pointer ${
                        selectedTimeRange === option.value
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-black/[0.04] text-[#86868b] hover:bg-black/[0.06]'
                      }`} onClick={() => setSelectedTimeRange(option.value)}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {selectedTimeRange === 'custom' && (
                    <div className="flex gap-1.5">
                      <input type="text" placeholder="开始时间" className="flex-1 px-2.5 py-[5px] text-[12px] bg-black/[0.03] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                      <input type="text" placeholder="结束时间" className="flex-1 px-2.5 py-[5px] text-[12px] bg-black/[0.03] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </div>
                  )}

                  {/* Templates select */}
                  <div className="flex gap-1.5 items-center">
                    <select className="flex-1 px-2.5 py-[6px] text-[12px] bg-black/[0.03] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-[#86868b] cursor-pointer border-0" value="" onChange={(e) => { if (e.target.value) handlePromptChange(group.chat, e.target.value) }}>
                      <option value="">快捷模板</option>
                      {ANALYSIS_TEMPLATES.map((t) => (<option key={t.label} value={t.prompt}>{t.label}</option>))}
                      {customTemplates.length > 0 && <option disabled>── 自定义模板 ──</option>}
                      {customTemplates.map((t, i) => (<option key={i} value={t.prompt}>{t.label}</option>))}
                    </select>
                    {customTemplates.length > 0 && (
                      <button onClick={() => setShowManageModal(true)} className="px-2 py-[6px] text-[12px] text-[#86868b] hover:text-[#007AFF] bg-black/[0.03] rounded-[8px] hover:bg-black/[0.06] transition-colors duration-150 cursor-pointer flex-shrink-0">
                        管理
                      </button>
                    )}
                  </div>

                  {/* Textarea with save button */}
                  <div className="relative">
                    <textarea className="w-full px-3 py-2 pr-9 text-[13px] bg-black/[0.03] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none placeholder:text-[#aeaeb2] transition-colors duration-150" rows={2} placeholder="输入分析指令..." value={prompt} onChange={(e) => handlePromptChange(group.chat, e.target.value)} disabled={config.isRunning} />
                    <div className="group/save absolute right-2 bottom-2 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); setNewTemplateName(''); setSaveError(''); setShowSaveModal(true) }}
                        disabled={!prompt.trim() || config.isRunning}
                        className={`w-[24px] h-[24px] flex items-center justify-center rounded-[6px] transition-colors duration-150 ${
                          prompt.trim() && !config.isRunning
                            ? 'text-[#007AFF] hover:bg-[#007AFF]/[0.08] cursor-pointer'
                            : 'text-[#aeaeb2] cursor-default'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 bottom-[28px] px-2 py-1 text-[10px] text-white bg-[#1d1d1f]/90 rounded-[5px] whitespace-nowrap opacity-0 group-hover/save:opacity-100 transition-opacity duration-150 pointer-events-none">
                        保存为模板
                      </div>
                    </div>
                  </div>

                  {/* Analyze button */}
                  <button className={`w-full py-[9px] text-[13px] rounded-[10px] font-medium transition-colors duration-150 cursor-pointer ${
                    canAnalyze
                      ? 'bg-[#007AFF] text-white hover:bg-[#0066D6]'
                      : 'bg-black/[0.04] text-[#aeaeb2] cursor-not-allowed'
                  }`} onClick={() => analyze([group.chat])} disabled={!canAnalyze}>
                    {analyzing ? (
                      <span className="flex items-center justify-center gap-1.5"><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>分析中</span>
                    ) : '立即分析'}
                  </button>

                  {/* Divider */}
                  <div className="border-t border-black/[0.06] my-1"></div>

                  {/* Label: Monitor interval */}
                  <div className="text-[11px] text-[#86868b] font-medium">监控间隔</div>
                  <div className="flex gap-1 flex-wrap">
                    {INTERVAL_PRESETS.map((opt) => (
                      <button key={opt.value} className={`px-2.5 py-[5px] text-[11px] rounded-[6px] transition-colors duration-150 cursor-pointer ${
                        config.intervalMs === opt.value && !isCustomActive
                          ? 'bg-[#007AFF] text-white'
                          : 'bg-black/[0.04] text-[#86868b] hover:bg-black/[0.06]'
                      }`} onClick={() => { setIntervalMs(group.chat, opt.value); setCustomIntervalGroup(null) }} disabled={config.isRunning}>
                        {opt.label}
                      </button>
                    ))}
                    <button className={`px-2.5 py-[5px] text-[11px] rounded-[6px] transition-colors duration-150 cursor-pointer ${
                      isCustomActive || (!isPresetInterval(config.intervalMs) && config.intervalMs > 0)
                        ? 'bg-[#007AFF] text-white'
                        : 'bg-black/[0.04] text-[#86868b] hover:bg-black/[0.06]'
                    }`} onClick={() => {
                      if (isCustomActive) { setCustomIntervalGroup(null) }
                      else { setCustomIntervalGroup(group.chat); setCustomInterval('') }
                    }} disabled={config.isRunning}>
                      自定义
                    </button>
                  </div>
                  {isCustomActive && (
                    <div className="flex gap-1.5 items-center">
                      <input type="number" min="1" placeholder="输入间隔" className="flex-1 px-2.5 py-[5px] text-[12px] bg-black/[0.03] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" value={customInterval} onChange={(e) => setCustomInterval(e.target.value)} disabled={config.isRunning} />
                      <span className="text-[12px] text-[#86868b] flex-shrink-0">分钟</span>
                      <button className="px-3 py-[5px] text-[11px] bg-[#007AFF] text-white rounded-[8px] hover:bg-[#0066D6] transition-colors duration-150 cursor-pointer flex-shrink-0" onClick={() => { const mins = parseInt(customInterval); if (mins > 0) { setIntervalMs(group.chat, mins * 60000); setCustomIntervalGroup(null); setCustomInterval('') } }} disabled={config.isRunning || !customInterval || parseInt(customInterval) <= 0}>
                        确定
                      </button>
                    </div>
                  )}

                  {/* Monitor button */}
                  <button className={`w-full py-[9px] text-[13px] rounded-[10px] font-medium transition-colors duration-150 cursor-pointer ${
                    config.isRunning
                      ? 'bg-[#FF3B30] text-white hover:bg-[#E0342B]'
                      : canMonitor
                        ? 'bg-[#FF9500] text-white hover:bg-[#E68600]'
                        : 'bg-black/[0.04] text-[#aeaeb2] cursor-not-allowed'
                  }`}
                    onClick={async () => { setMonitorError(''); try { config.isRunning ? await stopOne(group.chat) : await startOne(group.chat) } catch (err: any) { setMonitorError(err.message) } }}
                    disabled={!config.isRunning && !canMonitor}
                  >
                    {config.isRunning ? '停止监控' : '开始监控'}
                  </button>
                  {monitorError && <div className="text-[11px] text-[#FF3B30] bg-[#FF3B30]/[0.06] rounded-[8px] p-2">{monitorError}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-[14px] p-5 w-[300px] shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">保存为模板</h3>
            <input
              type="text"
              placeholder="模板名称，如「会议纪要」"
              className="w-full px-3 py-[7px] text-[13px] bg-black/[0.03] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 placeholder:text-[#aeaeb2]"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate() }}
              autoFocus
            />
            {saveError && <p className="text-[11px] text-[#FF3B30] mt-1.5">{saveError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowSaveModal(false)} className="flex-1 py-[7px] text-[13px] bg-black/[0.04] text-[#1d1d1f] rounded-[8px] hover:bg-black/[0.06] transition-colors duration-150 cursor-pointer font-medium">
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className={`flex-1 py-[7px] text-[13px] rounded-[8px] font-medium transition-colors duration-150 cursor-pointer ${
                  newTemplateName.trim()
                    ? 'bg-[#007AFF] text-white hover:bg-[#0066D6]'
                    : 'bg-black/[0.04] text-[#aeaeb2] cursor-not-allowed'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Templates Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowManageModal(false)}>
          <div className="bg-white rounded-[14px] p-5 w-[320px] shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold text-[#1d1d1f] mb-3">自定义模板</h3>
            {customTemplates.length === 0 ? (
              <p className="text-[12px] text-[#86868b] py-4 text-center">暂无自定义模板</p>
            ) : (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {customTemplates.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] rounded-[8px] group">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#1d1d1f] truncate">{t.label}</div>
                      <div className="text-[10px] text-[#aeaeb2] truncate mt-[1px]">{t.prompt.slice(0, 40)}{t.prompt.length > 40 ? '...' : ''}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(i)}
                      className="w-[22px] h-[22px] flex items-center justify-center rounded-[5px] text-[#aeaeb2] hover:text-[#FF3B30] hover:bg-[#FF3B30]/[0.08] opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer flex-shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowManageModal(false)} className="w-full mt-3 py-[7px] text-[13px] bg-black/[0.04] text-[#1d1d1f] rounded-[8px] hover:bg-black/[0.06] transition-colors duration-150 cursor-pointer font-medium">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
