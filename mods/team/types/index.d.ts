export type RoleId = 'pm' | 'researcher' | 'designer' | 'programmer' | 'tester' | 'reviewer' | 'security' | 'legal' | 'marketer'
export type Run = { id: string; role: RoleId; agent: string; task: string; isDone: boolean }
export type Preview = { url: string; from: string }
export type TurnCost = { tokens: number; cacheRead: number }

declare module 'claude-code' {
  interface PluginState {
    team: { runs: Run[]; isLeadWorking: boolean; preview: Preview | null; last: TurnCost | null }
  }
}
