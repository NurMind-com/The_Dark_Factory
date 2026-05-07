# Implementation Plan: Enable Response to Comments

## Summary of the Requested Change

Enable automated response to comments on GitHub pull requests and issues using Claude Code. When a comment is posted that mentions Claude or contains specific triggers, the workflow should automatically invoke Claude to generate and post a response, similar to how the branch creation workflow currently works.

## Current Workflow/Script Files to Inspect

- `.github/workflows/jira-branch-readme.yml` - Current workflow for branch creation automation
- `.github/scripts/jira-branch-automation.mjs` - Automation script for Jira integration
- `CLAUDE.md` - Repository instructions for Claude

## Proposed Implementation Steps

### 1. Create Comment Response Workflow
- Create new workflow file `.github/workflows/comment-response.yml`
- Trigger on `issue_comment` and `pull_request_review_comment` events
- Check if comment mentions Claude or contains trigger phrases
- Use Claude Code base action to process and respond

### 2. Extend Automation Script
- Add new mode `respond` to `jira-branch-automation.mjs`
- Parse comment content and extract context
- Generate appropriate prompt for Claude based on comment and context
- Post Claude's response as a reply to the original comment

### 3. Configure Claude Code Action for Comments
- Set up appropriate model and settings for comment responses
- Define allowed tools based on comment context
- Implement safeguards to prevent infinite loops (Claude responding to its own comments)

### 4. Add Comment Instructions
- Create instructions for Claude to understand comment context
- Include guidelines for appropriate responses
- Add information about available repository context

## Secrets/Configuration Required

Existing secrets (already configured):
- `CLAUDE_CODE_OAUTH_TOKEN` - For Claude Code authentication
- `GH_PR_TOKEN` - For GitHub API operations with comment permissions
- `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` - For Jira integration (if needed)

No new secrets required.

## Testing Plan

1. **Unit Testing**
   - Test comment parsing logic
   - Verify trigger detection works correctly
   - Test response formatting

2. **Integration Testing**
   - Create test PR with sample comment
   - Verify workflow triggers correctly
   - Confirm Claude response is posted
   - Test edge cases (empty comments, special characters)

3. **Safety Testing**
   - Ensure Claude doesn't respond to its own comments
   - Test rate limiting to prevent spam
   - Verify proper error handling

## Risks and Rollback Notes

### Risks
1. **Infinite Loop Risk**: Claude could respond to its own comments
   - Mitigation: Check comment author before triggering workflow
   
2. **API Rate Limits**: Too many comments could exhaust API quotas
   - Mitigation: Implement rate limiting and cooldown periods
   
3. **Inappropriate Responses**: Claude might generate unhelpful responses
   - Mitigation: Clear prompt engineering and context provision

### Rollback Strategy
1. Disable workflow by setting workflow file to `workflow_dispatch` only
2. Remove comment webhook permissions if needed
3. Revert to manual comment responses

## Claude Instructions for Chrome Extension Users

When using Claude in Chrome to interact with GitHub comments:

1. **Viewing Comments**: Claude can see the comment thread context when you share the page
2. **Generating Responses**: Ask Claude to draft a response based on the comment
3. **Code Context**: Claude can reference repository files if you provide links
4. **Best Practices**:
   - Be specific about what kind of response you want
   - Provide relevant code context when asking about implementation
   - Review Claude's response before posting
   - Use Claude for technical explanations, code reviews, and implementation suggestions