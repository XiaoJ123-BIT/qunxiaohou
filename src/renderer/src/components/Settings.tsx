import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settings'

export default function Settings() {
  const { apiKey, model, apiBase, wechatCliPath, wechatCliStatus,
    setApiKey, setModel, setApiBase, setWechatCliPath,
    save, fetch, checkWechatCli } = useSettingsStore()
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetch() }, [])

  const handleSave = async () => {
    await save()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-5 pb-4 pt-3 space-y-3">
      {[
        { label: 'API Key', value: apiKey, onChange: setApiKey, type: 'password', placeholder: '输入 API Key' },
        { label: '模型', value: model, onChange: setModel, type: 'text', placeholder: '例如 glm-5, gpt-4o' },
        { label: 'API Base URL', value: apiBase, onChange: setApiBase, type: 'text', placeholder: '' },
        { label: 'wechat-cli 路径', value: wechatCliPath, onChange: setWechatCliPath, type: 'text', placeholder: '留空自动检测' },
      ].map((field) => (
        <div key={field.label}>
          <label className="text-[12px] text-[#86868b] block mb-1">{field.label}</label>
          <input
            type={field.type}
            className="w-full px-3 py-[7px] text-[13px] bg-black/[0.03] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-colors duration-150 placeholder:text-[#aeaeb2]"
            placeholder={field.placeholder}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        </div>
      ))}

      <button
        className="flex-1 py-[7px] text-[12px] rounded-[8px] bg-black/[0.04] text-[#1d1d1f] hover:bg-black/[0.06] transition-colors duration-150 cursor-pointer w-full font-medium"
        onClick={checkWechatCli}
        disabled={wechatCliStatus.checking}
      >
        {wechatCliStatus.checking ? '检测中...' : '检测 wechat-cli'}
      </button>

      {wechatCliStatus.message && (
        <div className={`p-2.5 text-[12px] rounded-[8px] ${wechatCliStatus.available ? 'bg-[#34C759]/[0.08] text-[#248A3D]' : 'bg-[#FF3B30]/[0.08] text-[#FF3B30]'}`}>
          {wechatCliStatus.message}
        </div>
      )}

      <button
        className={`w-full py-[9px] text-[13px] rounded-[10px] font-medium transition-colors duration-150 cursor-pointer ${
          saved
            ? 'bg-[#34C759] text-white'
            : 'bg-[#007AFF] text-white hover:bg-[#0066D6]'
        }`}
        onClick={handleSave}
      >
        {saved ? '已保存' : '保存设置'}
      </button>
    </div>
  )
}