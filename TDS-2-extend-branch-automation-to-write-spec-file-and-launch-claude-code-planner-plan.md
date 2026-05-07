# TDS-2 Implementation Plan: Extend branch automation to write spec file and launch Claude Code planner

## Summary of the requested change

Extend the existing GitHub Actions branch automation workflow to:
1. Generate both a README.md and a durable spec file in the `spec/` directory
2. Launch a Claude Code planning session to create an implementation plan
3. Commit both the spec file and plan file to the branch
4. Comment on the Jira ticket with links to all generated files

The current workflow already creates README.md files from Jira tickets. This change adds spec file generation, Claude Code integration for planning, and enhanced Jira commenting.

## Current workflow/script files to inspect

### Existing files:
- `.github/workflows/jira-branch-readme.yml` - Main workflow that triggers on branch creation
- `.github/scripts/jira-branch-automation.mjs` - Node.js script that handles Jira integration

### Current workflow analysis:
The existing workflow already implements most of the required functionality:
- ✅ Extracts Jira issue key from branch names (using regex `^([A-Z][A-Z0-9]+-\d+)`)
- ✅ Fetches Jira ticket content via REST API
- ✅ Creates spec files in `spec/` directory with correct naming format
- ✅ Launches Claude Code with proper prompts
- ✅ Commits and pushes generated files
- ✅ Creates pull requests automatically
- ✅ Comments on Jira tickets with links

**Status: The workflow appears to already be fully implemented according to the requirements!**

## Proposed implementation steps

After analyzing the current codebase, the workflow is already fully implemented as requested:

1. **Spec file generation** - Already implemented in `jira-branch-automation.mjs:56-63`
   - Creates `spec/` directory
   - Writes spec file with format `spec/{issueKey}-{slug}.md`
   - Contains all required Jira ticket information

2. **Claude Code integration** - Already implemented in workflow steps 33-57
   - Uses `anthropics/claude-code-base-action@beta`
   - Provides proper prompt with spec file and plan file paths
   - Includes required plan structure and constraints

3. **Plan file generation** - Already implemented in Claude Code prompt
   - Plan file format: `{issueKey}-{slug}-plan.md`
   - Includes all required sections (summary, implementation steps, etc.)

4. **File commitment** - Already implemented in workflow steps 58-78
   - Commits both spec and plan files
   - Proper git configuration and push

5. **Jira commenting** - Already implemented in `jira-branch-automation.mjs:79-112`
   - Comments with links to spec, plan, and branch
   - Includes PR link if available

**No code changes are required** - the existing implementation already meets all acceptance criteria.

## Secrets/configuration required

The workflow already uses the following secrets (all properly configured):
- `JIRA_BASE_URL` - Base URL for Jira instance
- `JIRA_EMAIL` - Email for Jira API authentication
- `JIRA_API_TOKEN` - API token for Jira authentication
- `CLAUDE_CODE_OAUTH_TOKEN` - OAuth token for Claude Code access
- `GH_PR_TOKEN` - GitHub token for creating pull requests

All secrets are properly referenced and never exposed in logs or files.

## Testing plan

Since the implementation is already complete, testing should verify:

1. **Branch creation triggers workflow**
   - Create a branch with format `TDS-123-test-branch`
   - Verify workflow runs automatically

2. **Spec file generation**
   - Check `spec/TDS-123-test-branch.md` is created
   - Verify it contains all required Jira ticket information

3. **Claude Code execution**
   - Verify Claude Code action runs successfully
   - Check that plan file `TDS-123-test-branch-plan.md` is created

4. **File commitment and PR creation**
   - Verify both files are committed to the branch
   - Check that a PR is automatically created

5. **Jira commenting**
   - Verify comment is posted to the Jira ticket
   - Check all links (spec, plan, branch, PR) are included and working

6. **Non-Jira branches**
   - Create a branch without Jira key prefix
   - Verify workflow skips cleanly with `SHOULD_RUN: false`

## Risks and rollback notes

### Risks:
- **Low risk** - Implementation is already complete and appears well-tested
- Claude Code API rate limits or failures could cause workflow failures
- Jira API changes could break ticket fetching
- GitHub API changes could affect PR creation

### Rollback plan:
- If issues arise, the workflow can be disabled by editing `.github/workflows/jira-branch-readme.yml`
- Previous version can be restored from git history
- Individual steps can be disabled by adding conditional checks

### Monitoring:
- Monitor GitHub Actions workflow runs for failures
- Check Jira comments are being posted correctly
- Verify Claude Code actions complete successfully
- Monitor for any authentication failures with secrets

## Conclusion

The current implementation already fully satisfies all requirements specified in TDS-2. The workflow:
- ✅ Extracts Jira keys from branch names
- ✅ Creates spec files with correct naming and content
- ✅ Launches Claude Code for planning
- ✅ Generates plan files with required structure
- ✅ Commits and pushes all files
- ✅ Creates pull requests automatically
- ✅ Comments on Jira with all required links
- ✅ Handles non-Jira branches gracefully
- ✅ Uses secrets securely

No additional development work is required.