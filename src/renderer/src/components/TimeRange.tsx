import { useAnalysisStore, TIME_RANGE_OPTIONS } from '../stores/analysis'

export default function TimeRange() {
  const { selectedTimeRange, customStart, customEnd, setSelectedTimeRange, setCustomStart, setCustomEnd } = useAnalysisStore()

  return (
    <div>
      <div className="text-[11px] text-gray-400 font-medium mb-2.5 uppercase tracking-wider">时间范围</div>
      <div className="grid grid-cols-4 gap-1.5">
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`px-2 py-1.5 text-[11px] rounded-lg border transition-all font-medium ${
              selectedTimeRange === option.value
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
            onClick={() => setSelectedTimeRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {selectedTimeRange === 'custom' && (
        <div className="mt-2 space-y-1.5">
          <input
            type="text"
            placeholder="开始 YYYY-MM-DD HH:MM"
            className="w-full px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <input
            type="text"
            placeholder="结束 YYYY-MM-DD HH:MM"
            className="w-full px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-400"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}