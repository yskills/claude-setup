# The `Claude` Windows user on MeinLaptop

Claude's own home on yskills' laptop since 2026-10-08: a standard (non-admin) Windows user named
`Claude`, home `C:\Users\Claude`. Remote Control sessions for project work run here. Everything
in `install.mjs` works as on yskills' own user (`C:\Users\Ich`); this page lists only what differs.

## What is different

| Item | On this user | Why |
|---|---|---|
| Git | Portable Git in `C:\Users\Claude\Git` (PortableGit 2.55.0.5), `C:\Users\Claude\Git\cmd` on the **user** PATH | `winget install Git.Git` elevates and fails with exit code 4 on a standard user |
| Git Bash for Claude Code | user env `CLAUDE_CODE_GIT_BASH_PATH=C:\Users\Claude\Git\bin\bash.exe` | Claude Code needs Git Bash; the portable one is not where it looks by default |
| Claude Code | `C:\Users\Claude\.local\bin\claude.exe`, folder on the user PATH | native installer puts it there; PATH entry added by hand |
| claude-setup clone | `C:\Users\Claude\claude-setup` | same as `C:\Users\Ich\claude-setup` on yskills' user |
| Node, gh, Chrome | winget, machine-wide (`C:\Program Files\...`) | installed with yskills at the laptop |
| Python 3.13, ffmpeg, uv, fnm | winget `--scope user` (all in `%LOCALAPPDATA%`) | the tools `install.mjs` reports as missing |
| pwsh 7 | Microsoft Store package via `winget install --id 9MZ1SNWT0N5D --source msstore` | the MSI needs admin; `live-shot.ps1` needs pwsh |
| Blender | 5.1, machine-wide (`C:\Program Files\Blender Foundation`) | shared with yskills' user |
| GitHub | `gh` logged in as `yskills-claude`; commits are authored as `Claude <339700673+yskills-claude@users.noreply.github.com>` | Claude's own account, collaborator on the repos |
| Claude in Chrome | extension installed in this user's Chrome profile | a session only has the tools it started with, so the next session there drives it |
| Roblox Studio | not installed | installs per user and needs a Roblox login Claude does not have yet |
| Environment variables | always set for the user, never machine-wide; no admin | standard user |

A shell started before a PATH change does not see it. Start a fresh shell (or a fresh Remote
Control session) after installs.

## What still needs yskills' hands

- **Blender connector:** the official Blender extension in the Claude desktop app plus its add-on
  in Blender (see the `studio` skill). The Blender user profile exists only after Blender was
  opened once on this user.
- **context7:** the plugin's MCP server asks for authentication once (`/mcp` in an interactive
  session).
- **Roblox Studio:** later, once Claude has a Roblox login.

## Update

```
git -C C:\Users\Claude\claude-setup pull
node C:\Users\Claude\claude-setup\install.mjs
```
