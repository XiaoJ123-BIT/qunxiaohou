import { useGroupsStore } from '../stores/groups'
import { useAnalysisStore, Message } from '../stores/analysis'

export default function MessageFeed() {
  const { selectedGroups } = useGroupsStore()
  const { messages, currentGroupName, fetchMessages, setCurrentGroupName } = useAnalysisStore()

  const handleGroupClick = (name: string) => {
    setCurrentGroupName(name)
    fetchMessages(name)
  }

  return (
    <div className="flex flex-col h-full">
      {selectedGroups.length > 0 && (
        <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto bg-gray-50/50">
          {selectedGroups.map((name) => (
            <button
              key={name}
              className={`px-3 py-1 text-[11px] rounded-full whitespace-nowrap font-medium transition-all ${
                currentGroupName === name
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
              onClick={() => handleGroupClick(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!currentGroupName && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm">选择群聊查看消息</span>
          </div>
        )}
        {currentGroupName && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              加载消息中...
            </div>
          </div>
        )}
        {messages.map((msg: Message, i: number) => (
          <div key={i} className="px-4 py-2.5 hover:bg-gray-50/80 transition-colors border-b border-gray-50">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-[12px] font-semibold text-indigo-600">{msg.sender}</span>
              <span className="text-[10px] text-gray-300">{msg.time}</span>
            </div>
            <div className="text-[13px] text-gray-700 leading-relaxed pl-0.5">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
