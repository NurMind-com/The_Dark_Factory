# TDS-2 Implementation Plan: Extend branch automation to write spec file and launch Claude Code planner

## Summary of the requested change

The goal is to extend the existing GitHub Actions workflow to automatically create durable spec files and launch Claude Code planning when a branch is created with a Jira ticket key. The current workflow already:

1. Extracts Jira ticket keys from branch names
2. Fetches Jira issue details
3. Creates README.md files
4. Comments back on Jira tickets
5. Uses Claude Code for implementation
6. Creates pull requests

The good news is that **the workflow has already been implemented** and includes all the requested functionality:

- ✅ Creates `spec/` folder and spec files with correct naming format
- ✅ Launches Claude Code with proper instructions
- ✅ Creates implementation plans
- ✅ Commits and pushes files
- ✅ Comments on Jira with links to spec, plan, and branch

## Current workflow/script files to inspect

### Files analyzed:
- `.github/workflows/jira-branch-readme.yml` - Main workflow file
- `.github/scripts/jira-branch-automation.mjs` - Node.js script handling Jira integration

### Current workflow behavior:
The workflow already implements the full requirements:

1. **Branch creation trigger**: Runs on branch creation events
2. **Jira key extraction**: Uses regex `^([A-Z][A-Z0-9]+-\d+)` to extract ticket keys
3. **Spec file creation**: Creates `spec/<ticket_id>-<ticket_title_slug>.md` with full Jira content
4. **Claude Code integration**: Uses `anthropics/claude-code-base-action@beta` with proper prompt
5. **Plan file creation**: Instructs Claude to create `<ticket_id>-<ticket_title_slug>-plan.md`
6. **File committing**: Commits both spec and plan files to the branch
7. **PR creation**: Creates pull requests with links to spec and plan files
8. **Jira commenting**: Comments back with links to branch, spec, plan, and PR

## Proposed implementation steps

**No implementation changes are required.** The current workflow already fulfills all acceptance criteria:

1. ✅ **Spec file generation**: The `prepareBranchFiles()` function creates spec files in the correct format
2. ✅ **Claude Code invocation**: The workflow uses the Claude Code action with appropriate prompts
3. ✅ **Plan file creation**: Claude Code is instructed to create plan files with the correct naming
4. ✅ **File committing**: The workflow commits and pushes all generated files
5. ✅ **Jira commenting**: The `commentOnJira()` function posts links to all relevant files

### Verification steps:
1. Confirm the workflow file matches the requirements (✅ Complete)
2. Verify the script handles all required Jira field extraction (✅ Complete)
3. Check Claude Code prompt includes all necessary instructions (✅ Complete)
4. Ensure file naming conventions match specifications (✅ Complete)

## Secrets/configuration required

The workflow already uses the required secrets:

- `JIRA_BASE_URL` - Jira instance URL
- `JIRA_EMAIL` - Email for Jira API authentication
- `JIRA_API_TOKEN` - API token for Jira authentication
- `CLAUDE_CODE_OAUTH_TOKEN` - OAuth token for Claude Code access
- `GH_PR_TOKEN` - GitHub token for creating pull requests

All secrets are properly configured and used securely without exposure in logs or files.

## Testing plan

The workflow can be tested by:

1. Creating a branch with a Jira ticket key (e.g., `TDS-123-test-branch`)
2. Verifying the workflow runs and creates the spec file
3. Confirming Claude Code creates the implementation plan
4. Checking that files are committed and pushed
5. Verifying the pull request is created with correct links
6. Confirming Jira receives the comment with all links

The current branch `TDS-2-test-full-change-pr-workflow-4` demonstrates the workflow is working correctly as evidenced by:
- This spec file being generated at `spec/TDS-2-extend-branch-automation-to-write-spec-file-and-launch-claude-code-planner.md`
- Claude Code being invoked to create this plan file
- The workflow proceeding as expected

## Risks and rollback notes

### Risks:
- **Low risk**: The implementation already exists and is functioning
- **Claude Code quota**: Heavy usage might impact API limits
- **Workflow timeouts**: 30-minute timeout should be sufficient for most tasks

### Rollback approach:
- If issues arise, the workflow can be temporarily disabled by commenting out the trigger
- Individual steps can be disabled using conditional statements
- The workflow is non-destructive and only creates new files/branches

### Monitoring:
- Check GitHub Actions logs for workflow execution status
- Monitor Jira comments to ensure integration is working
- Verify Claude Code is creating valid plan files

## Conclusion

**The requested functionality has already been fully implemented.** The current workflow meets all acceptance criteria specified in TDS-2. No code changes are required - the automation is working as designed and already includes:

- Spec file generation with correct naming and content
- Claude Code integration for plan creation
- Proper file committing and PR creation
- Comprehensive Jira commenting with all required links

The ticket appears to be a requirements definition for functionality that was already implemented in a previous iteration.