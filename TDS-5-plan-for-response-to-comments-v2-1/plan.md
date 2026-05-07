# TDS-5: Implementation Plan - Jira Comment-Triggered Automation

## Summary of the Requested Change

This ticket requests a **planning document only** (not implementation) for extending the current Jira-GitHub-Claude automation to support triggering workflows via Jira comments containing `[TDF]`. The goal is to enable iterative Claude interactions on existing tickets through comments, rather than only on initial branch creation.

The deliverables are:
1. A detailed execution plan for implementing comment-triggered automation
2. Copy-pasteable instructions for configuring Jira automation
3. Clear explanation of the complete flow from Jira comment to Claude response

## Current Workflow/Script Files to Inspect

Based on repository analysis, these are the key files involved:

1. **`.github/workflows/jira-branch-readme.yml`** - Main workflow triggered on branch creation
2. **`.github/scripts/jira-branch-automation.mjs`** - Node.js script handling Jira API interactions
3. **`CLAUDE.md`** - Repository instructions for Claude Code
4. **Root `README.md`** - Contains links to generated artifacts

Current flow:
- Jira automation creates branch → GitHub webhook triggers → Workflow runs → Claude processes spec → PR created → Jira updated

## Proposed Implementation Steps

### Phase 1: GitHub Actions Setup for repository_dispatch

1. **Create new workflow file**: `.github/workflows/jira-comment-trigger.yml`
   - Trigger on `repository_dispatch` event with type `jira_comment`
   - Accept payload containing: issue key, comment text, comment author, comment ID
   - Reuse existing Claude Code action configuration
   - Support both PR creation and Jira comment response modes

2. **Extend existing script**: Update `.github/scripts/jira-branch-automation.mjs`
   - Add new mode: `process-comment` 
   - Parse comment text for Claude instructions
   - Fetch full issue context including previous comments
   - Generate context-aware spec file including comment history
   - Post Claude's response back to Jira as a new comment

### Phase 2: Jira Automation Configuration

Create Jira automation rule with these components:

1. **Trigger**: Issue commented
2. **Condition**: Comment contains `[TDF]`
3. **Action**: Send web request to GitHub
   - URL: `https://api.github.com/repos/NurMind-com/The_Dark_Factory/dispatches`
   - Method: POST
   - Headers:
     - `Accept: application/vnd.github+json`
     - `Authorization: Bearer {{github_pat}}`
   - Body:
     ```json
     {
       "event_type": "jira_comment",
       "client_payload": {
         "issue_key": "{{issue.key}}",
         "issue_url": "{{issue.url}}",
         "comment_text": "{{comment.body}}",
         "comment_author": "{{comment.author.displayName}}",
         "comment_id": "{{comment.id}}",
         "branch_name": "{{issue.key|lower}}-{{issue.summary|slugify}}"
       }
     }
     ```

### Phase 3: Claude Prompt Engineering

Update `CLAUDE.md` with comment-specific instructions:
- Detect when running in comment mode vs branch mode
- Parse comment instructions for specific tasks
- Maintain context from previous interactions
- Decide whether to create PR or just respond via comment
- Format responses appropriately for Jira comments

### Phase 4: Response Routing Logic

Implement decision logic for response type:
- If comment requests code changes → Create PR
- If comment asks questions → Post Jira comment response  
- If comment requests analysis → Post findings to Jira
- Support explicit directives like `[PR]` or `[COMMENT]` in the `[TDF]` text

## Secrets/Configuration Required

### GitHub Secrets (existing):
- `CLAUDE_CODE_OAUTH_TOKEN` ✓
- `JIRA_BASE_URL` ✓
- `JIRA_EMAIL` ✓
- `JIRA_API_TOKEN` ✓
- `GH_PR_TOKEN` ✓

### Jira Automation Variables (new):
- `github_pat` - GitHub Personal Access Token with `repo` and `workflow` scopes
- Must be configured as Jira automation variable, not exposed in automation JSON

### Security Considerations:
- Validate `repository_dispatch` payloads contain expected fields
- Implement rate limiting via GitHub Actions concurrency groups
- Log all comment triggers for audit trail
- Consider allowlist of authorized Jira users for `[TDF]` triggers

## Testing Plan

### Local Testing:
1. Use GitHub CLI to simulate `repository_dispatch` events:
   ```bash
   gh api repos/NurMind-com/The_Dark_Factory/dispatches \
     --method POST \
     --field event_type=jira_comment \
     --field 'client_payload[issue_key]=TEST-1' \
     --field 'client_payload[comment_text]=[TDF] Test comment trigger'
   ```

2. Test script modes independently:
   ```bash
   node .github/scripts/jira-branch-automation.mjs process-comment
   ```

### Integration Testing:
1. Create test Jira ticket
2. Add comment with `[TDF] analyze the workflow files`
3. Verify GitHub Actions triggered
4. Confirm Claude processes request
5. Check Jira receives response comment

### Edge Cases to Test:
- Multiple `[TDF]` comments in rapid succession
- Comments on closed/resolved issues
- Malformed comment syntax
- Very long comment text
- Comments with attachments/images
- Network failures during processing

## Risks and Rollback Notes

### Identified Risks:

1. **Automation Loops**: 
   - Risk: Claude's response triggers another `[TDF]` comment
   - Mitigation: Ignore comments from automation users
   - Rollback: Disable Jira automation rule

2. **Rate Limits**:
   - Risk: Too many comments exhaust GitHub Actions minutes or API limits
   - Mitigation: Implement concurrency controls and cooldown periods
   - Rollback: Temporarily disable webhook in Jira

3. **Security Exposure**:
   - Risk: Unauthorized users trigger expensive Claude operations
   - Mitigation: Validate comment authors against allowlist
   - Rollback: Rotate GitHub PAT and update Jira automation

4. **Context Confusion**:
   - Risk: Claude loses context between comment interactions
   - Mitigation: Include full issue history in each spec generation
   - Rollback: Revert to branch-only triggers

5. **Merge Conflicts**:
   - Risk: Multiple comments create conflicting PRs
   - Mitigation: Use branch naming with timestamp/comment ID
   - Rollback: Manual PR management

### Rollback Plan:
1. Disable Jira automation rule immediately
2. Cancel any running GitHub Actions workflows
3. Revert to previous workflow version if needed
4. Clean up any orphaned branches/PRs
5. Document lessons learned for next iteration

## Copy-Pasteable Jira Automation Instructions

### Step 1: Create GitHub PAT
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "Jira Comment Automation"
4. Select scopes: `repo` (full), `workflow`
5. Generate and copy token immediately

### Step 2: Configure Jira Automation

1. Navigate to Jira → Project Settings → Automation
2. Click "Create rule"
3. Configure as follows:

**WHEN: Issue commented**
- No additional configuration needed

**IF: Comment contains text**
- Text to match: `[TDF]`
- Match type: Contains

**THEN: Send web request**
- Web request URL: 
  ```
  https://api.github.com/repos/NurMind-com/The_Dark_Factory/dispatches
  ```
- Method: `POST`
- Headers:
  ```
  Accept: application/vnd.github+json
  Authorization: Bearer YOUR_GITHUB_PAT_HERE
  Content-Type: application/json
  ```
- Body (Custom data):
  ```json
  {
    "event_type": "jira_comment",
    "client_payload": {
      "issue_key": "{{issue.key}}",
      "issue_url": "{{baseUrl}}/browse/{{issue.key}}",
      "issue_summary": "{{issue.summary}}",
      "comment_text": "{{comment.body.plainText}}",
      "comment_author": "{{comment.author.displayName}}",
      "comment_author_id": "{{comment.author.accountId}}",
      "comment_id": "{{comment.id}}",
      "project_key": "{{project.key}}"
    }
  }
  ```

4. Name the rule: "Trigger GitHub Actions on [TDF] Comment"
5. Enable the rule

### Step 3: Test the Integration

Add a comment to any issue:
```
[TDF] Please analyze the current implementation and suggest improvements
```

Monitor:
- Jira Automation audit log
- GitHub Actions tab in repository
- Jira issue for response comment

## Claude Chrome Extension Context

**Important Note**: The original request mentions "Claude in Chrome" and maintaining the "same session". This plan focuses on the GitHub Actions + Claude Code integration, which operates independently of browser sessions. 

If browser-based Claude integration is required, consider these alternatives:

1. **Browser Extension Bridge**: Create a Chrome extension that polls a GitHub endpoint for tasks and feeds them to Claude in the browser
2. **Local Claude CLI**: Use Anthropic's Claude CLI locally with session persistence
3. **Webhook Relay**: Use a service like ngrok to relay webhooks to a local Claude instance

The current plan implements server-side automation without browser dependency, which is more reliable and doesn't require manual browser interaction.

## Summary

This plan provides a complete blueprint for extending The Dark Factory's automation to support comment-triggered workflows. The implementation maintains backward compatibility while adding powerful iterative capabilities through Jira comments. The approach prioritizes security, auditability, and gradual rollout to minimize risk.

**Key Deliverable**: The Jira automation configuration above can be directly copied and pasted after replacing `YOUR_GITHUB_PAT_HERE` with an actual GitHub Personal Access Token.

**Next Steps**: 
1. Review and approve this plan
2. Create GitHub PAT with required scopes
3. Implement the GitHub Actions workflow
4. Configure Jira automation
5. Test with non-critical issues first
6. Monitor and iterate based on usage patterns