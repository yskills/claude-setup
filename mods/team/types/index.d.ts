export type RoleId = 'lead' | 'programmer' | 'reviewer' | 'security' | 'legal' | 'design' | 'qa' | 'planning'
export type Run = { id: string; role: RoleId; agent: string; task: string; isDone: boolean }
export type Preview = { url: string; from: string }
export type TurnCost = { tokens: number; cacheRead: number }

declare module 'claude-code' {
  interface PluginState {
    team: { runs: Run[]; isLeadWorking: boolean; preview: Preview | null; last: TurnCost | null }
  }
}
