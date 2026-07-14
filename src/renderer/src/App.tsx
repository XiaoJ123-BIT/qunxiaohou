import { useState, useEffect, useRef } from 'react'
import GroupList from './components/GroupList'
import UnifiedResults from './components/UnifiedResults'
import Settings from './components/Settings'
import { useGroupsStore } from './stores/groups'
import { useSettingsStore } from './stores/settings'
import { useMonitorStore } from './stores/monitor'

export default function App() {
  const settingsRef = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const { fetchGroups } = useGroupsStore()
  const { fetch: fetchSettings, tokenBalance, openTokenPay } = useSettingsStore()
  const { fetchResults, fetchAllStatuses } = useMonitorStore()

  useEffect(() => {
    fetchGroups()
    fetchSettings()
    fetchResults()
    fetchAllStatuses()
  }, [])

  return (
    <div className="flex h-screen bg-[#f5f5f7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}>
      {/* Left Sidebar - macOS style */}
      <div className="w-80 bg-white/70 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col flex-shrink-0">
        {/* Header - clean, minimal */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
                        <img src="./icon.png" alt="ChatLens"
              className="w-9 h-9 rounded-[10px] shadow-[0_2px_8px_rgba(37,99,235,0.25)]" />
            <div className="flex-1 min-w-0">
              <h1 className="text-[14px] font-semibold text-[#1d1d1f] tracking-tight">群小猴</h1>
              <p className="text-[11px] text-[#86868b] mt-0.5">群聊智能分析</p>
            </div>
            <button
              onClick={openTokenPay}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[8px] bg-[#007AFF]/[0.08] text-[#007AFF] hover:bg-[#007AFF]/[0.14] transition-colors duration-150 cursor-pointer flex-shrink-0"
              title="购买 Token"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tokenBalance > 0
                ? `¥${(tokenBalance / 100).toFixed(2)}`
                : '充值'}
            </button>
          </div>
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto">
          <GroupList />
        </div>

        {/* Settings at bottom */}
        <div ref={settingsRef} className="border-t border-black/[0.06]">
          <button
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-black/[0.03] transition-colors duration-150 cursor-pointer"
            onClick={() => setShowSettings(!showSettings)}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-[16px] h-[16px] text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[13px] text-[#1d1d1f]">设置</span>
            </div>
            <svg className={`w-3 h-3 text-[#86868b] transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSettings && <Settings />}
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col bg-white rounded-xl m-2.5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <UnifiedResults />
      </div>
    </div>
  )
}