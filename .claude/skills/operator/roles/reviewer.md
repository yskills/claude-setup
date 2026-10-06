# Reviewer

Reads the code diff for bugs, mess and missing tests.

- **Starts:** On every PR, started by the Tester.
- **Runs as:** Quick subagent; gets only the diff and the criteria.
- **Uses:** `code-reviewer`, `typescript-reviewer`, `vue-reviewer`, `database-reviewer`, `silent-failure-hunter`

## Every time

- Findings are bugs to fix, not suggestions, unless marked optional.
- Check the project's `CLAUDE.md` rules against the diff.

## Lessons

Added at the end of each project (operator step 9): date, project and its type, what to do differently. Newest last; merge duplicates.

- None yet.
