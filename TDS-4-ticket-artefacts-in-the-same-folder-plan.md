# TDS-4: Ticket artefacts in the same folder - Implementation Plan

## Summary of the requested change
Update the GitHub Actions workflow to organize ticket artifacts by creating a folder with the ticket ID and title, containing all related files (spec and plan) instead of placing them in the root directory.

## Current workflow/script files to inspect
- `.github/workflows/jira-branch-readme.yml` - Main workflow that orchestrates the automation
- `.github/scripts/jira-branch-automation.mjs` - Script that generates README, spec files, and handles Jira interaction

## Proposed implementation steps

1. **Update `jira-branch-automation.mjs`**:
   - Modify `prepareBranchFiles()` function to create a ticket folder with format: `{ISSUE_KEY}-{slug}/`
   - Update spec file path from `spec/{issueKey}-{slug}.md` to `{issueKey}-{slug}/spec.md`
   - Update plan file path from `{issueKey}-{slug}-plan.md` to `{issueKey}-{slug}/plan.md`
   - Update README generation to reflect new file paths
   - Update environment variables passed to subsequent workflow steps

2. **Update workflow file****:
   - Modify the Claude Code action prompt to reference the new folder structure
   - Update commit logic to handle new directory structure
   - Update PR creation to reference correct file paths

3. **Update URL generation**:
   - Modify `commentOnJira()` function to generate correct GitHub URLs for the new folder structure

## Secrets/configuration required
No additional secrets or configuration changes required. The existing secrets will continue to work:
- `JIRA_BASE_URL`
- `JIRA_EMAIL` 
- `JIRA_API_TOKEN`
- `CLAUDE_CODE_OAUTH_TOKEN`
- `GH_PR_TOKEN`

## Testing plan
1. Verify script syntax with `node --check` on the modified automation script
2. Test folder creation logic by running the script locally (if possible)
3. Verify that all file paths in the workflow correctly reference the new structure
4. After deployment, create a test branch to verify end-to-end functionality

## Risks and rollback notes

**Risks**:
- Breaking existing workflow if file paths are incorrectly updated
- Claude Code action may fail if it cannot find the spec file at the expected location
- GitHub URLs in Jira comments may be incorrect if not properly updated

**Rollback strategy**:
- All changes are contained within the automation script and workflow file
- Can quickly revert by restoring previous file versions
- No database or external system changes required
- Existing branches/PRs will not be affected as they use the old structure

**Mitigation**:
- Update all file path references consistently across both files
- Test script syntax before committing
- Keep folder naming simple and consistent with existing slug generation