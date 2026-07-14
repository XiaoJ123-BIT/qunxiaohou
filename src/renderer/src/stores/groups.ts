import { create } from 'zustand'

export interface GroupSession {
  chat: string
  username: string
  is_group: boolean
  unread: number
  last_message: string
  msg_type: string
  sender: string
  timestamp: number
  time: string
}

export type SessionFilter = 'all' | 'personal' | 'group'

interface GroupsState {
  groups: GroupSession[]
  selectedGroup: string | null
  loading: boolean
  searchQuery: string
  error: string
  sessionFilter: SessionFilter
  setGroups: (groups: GroupSession[]) => void
  selectGroup: (name: string | null) => void
  setLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  setSessionFilter: (filter: SessionFilter) => void
  fetchGroups: () => Promise<void>
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  selectedGroup: null,
  loading: false,
  searchQuery: '',
  error: '',
  sessionFilter: 'all',
  setGroups: (groups) => set({ groups }),
  selectGroup: (name) => set({ selectedGroup: name }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSessionFilter: (filter) => set({ sessionFilter: filter }),
  fetchGroups: async () => {
    set({ loading: true })
    try {
      const groups = await window.api.getGroupSessions()
      set({ groups: groups || [], loading: false })
    } catch (err: any) {
      set({ groups: [], loading: false, error: err.message || String(err) })
    }
  }
}))
