# TDS-5: Plan for response to comments - Implementation Plan

## Summary of the requested change

Implement an automation system that triggers GitHub Actions (GHA) when a Jira comment containing `[TDF]` is added to a ticket. This system should:
1. Detect Jira comments with `[TDF]` marker
2. Trigger GitHub Actions workflow on the corresponding branch
3. Execute Claude Code automation that can result in PR creation, code changes, or Jira ticket updates
4. Provide instructions for configuring Jira automation rules that can be copy-pasted

## Current workflow/script files to inspect

- `.github/workflows/jira-branch-readme.yml` - Existing workflow triggered by branch creation
- `.github/scripts/jira-branch-automation.mjs` - Script handling Jira integration and automation logic
- Current flow: Jira ticket moved to "In Progress" → Branch created → GitHub workflow triggered → Claude Code automation

## Proposed implementation steps

### 1. Create new GitHub webhook workflow
- **File**: `.github/workflows/jira-comment-automation.yml`
- **Trigger**: Webhook payload from Jira automation
- **Purpose**: Handle comment-triggered automation requests

### 2. Extend automation script for comment handling
- **File**: `.github/scripts/jira-branch-automation.mjs`
- **New mode**: `comment-trigger` 
- **Features**:
  - Parse comment content for instructions
  - Determine automation type (code changes, analysis, etc.)
  - Extract context from comment and ticket
  - Execute appropriate Claude Code automation

### 3. Design Jira automation rule configuration
- **Trigger**: Comment added to any ticket
- **Condition**: Comment contains `[TDF]`
- **Action**: Send webhook to GitHub repository
- **Payload**: Include ticket key, comment content, branch information

### 4. Create webhook endpoint configuration
- **Endpoint**: GitHub repository webhook URL
- **Method**: POST
- **Authentication**: GitHub webhook secret
- **Payload structure**: Jira issue data + comment content

### 5. Implement Claude Code context passing
- **Extract relevant context**: Ticket description, existing code, comment instructions
- **Dynamic prompt generation**: Based on comment content and ticket context
- **Flexible output handling**: PR creation, direct commits, or Jira updates

## Secrets/configuration required

### Existing secrets (already configured):
- `JIRA_BASE_URL` - Jira instance URL
- `JIRA_EMAIL` - Service account email
- `JIRA_API_TOKEN` - Jira API authentication
- `CLAUDE_CODE_OAUTH_TOKEN` - Claude Code authentication
- `GH_PR_TOKEN` - GitHub PR creation token

### New secrets needed:
- `GITHUB_WEBHOOK_SECRET` - Secure webhook validation between Jira and GitHub
- Potentially `JIRA_WEBHOOK_TOKEN` - If additional Jira webhook authentication is required

### Jira automation rule configuration (copy-pasteable):

```json
{
  "name": "TDF Comment Automation",
  "state": "ENABLED",
  "ruleScope": {
    "resources": ["ari:cloud:jira::site/PROJECT_ID"]
  },
  "trigger": {
    "component": "TRIGGER",
    "type": "jira.issue.comment.created",
    "value": {
      "operations": ["CREATE"]
    }
  },
  "conditions": [
    {
      "component": "CONDITION",
      "type": "jira.comparator.condition",
      "value": {
        "first": "{{issue.comment.body}}",
        "operator": "CONTAINS",
        "second": "[TDF]"
      }
    }
  ],
  "actions": [
    {
      "component": "ACTION", 
      "type": "jira.send.web.request",
      "value": {
        "url": "https://api.github.com/repos/NurMind-com/The_Dark_Factory/dispatches",
        "method": "POST",
        "headers": {
          "Authorization": "token {{secrets.GITHUB_PAT}}",
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        "body": {
          "event_type": "jira_comment_tdf",
          "client_payload": {
            "issue_key": "{{issue.key}}",
            "comment_id": "{{comment.id}}",
            "comment_body": "{{comment.body}}",
            "comment_author": "{{comment.author.displayName}}",
            "branch_name": "{{issue.key.toLowerCase()}}-{{issue.summary | slugify}}",
            "issue_summary": "{{issue.summary}}",
            "issue_description": "{{issue.description}}"
          }
        }
      }
    }
  ]
}
```

### Manual Jira automation setup instructions:
1. Go to Project Settings → Automation
2. Create new rule with above JSON configuration
3. Replace `PROJECT_ID` with actual project ID
4. Configure GitHub PAT token with `repo` and `workflow` permissions
5. Test with a comment containing `[TDF]`

## Testing plan

### 1. Local script validation
- Run `node --check .github/scripts/jira-branch-automation.mjs` to verify syntax
- Test comment parsing logic with sample payloads
- Validate webhook payload structure

### 2. Jira automation rule testing
- Create test ticket in development environment
- Add comment with `[TDF]` marker
- Verify webhook payload delivery to GitHub
- Check workflow trigger and execution

### 3. End-to-end integration testing
- Test various comment scenarios:
  - Simple instruction: `[TDF] Add unit tests for user service`
  - Complex request: `[TDF] Refactor authentication to use OAuth2 and update documentation`
  - Analysis request: `[TDF] Review security implications of recent changes`
- Verify Claude Code receives correct context
- Test result delivery (PR creation vs. direct updates)

### 4. Error handling validation
- Test with malformed webhook payloads
- Verify graceful handling of missing branch/ticket
- Test Jira comment update on automation failure

## Risks and rollback notes

### **Risks**:
- **Webhook security**: Exposed endpoint could be exploited without proper validation
- **Rate limiting**: High comment volume could trigger GitHub API limits
- **Branch conflicts**: Multiple comments on same ticket could cause conflicts
- **Context misinterpretation**: Claude Code might misunderstand comment instructions
- **Infinite loops**: Automation responses creating new comments that trigger more automation

### **Rollback strategy**:
- **Immediate**: Disable Jira automation rule to stop webhook triggers
- **Workflow level**: Disable new workflow file via GitHub Actions settings
- **Script level**: Add feature flag to skip comment processing
- **Complete revert**: Remove new workflow file and script changes

### **Mitigation strategies**:
- **Security**: Implement webhook signature validation using GitHub secrets
- **Rate limiting**: Add queue/throttling mechanism for comment processing
- **Context clarity**: Require specific command format in comments (e.g., `[TDF:action] description`)
- **Loop prevention**: Track automation-generated comments to avoid re-triggering
- **Error handling**: Comprehensive logging and Jira comment updates on failures
- **Branch management**: Check for existing branches and handle branch switching
- **Permissions**: Validate user permissions before executing automation

### **Monitoring and observability**:
- GitHub Actions logs for webhook processing
- Jira audit logs for automation rule execution  
- Claude Code execution metrics and error rates
- Alert on webhook failures or high error rates

## Implementation order and dependencies

1. **Phase 1**: Create webhook workflow and extend automation script (no external dependencies)
2. **Phase 2**: Configure GitHub webhook secret and test locally
3. **Phase 3**: Set up Jira automation rule with provided JSON configuration
4. **Phase 4**: End-to-end testing and refinement
5. **Phase 5**: Production deployment with monitoring

This approach ensures gradual rollout with ability to test and validate each component independently before full integration.