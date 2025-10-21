# Pull Request

## Related OpenSpec Change

- OpenSpec change ID: `[change-id]` (e.g., `add-rfi-workflow`)
- Proposal: `openspec/changes/[change-id]/proposal.md`
- Tasks: `openspec/changes/[change-id]/tasks.md`

## Description

[Brief description of what this PR implements]

## Type of Change

- [ ] New feature (OpenSpec proposal implemented)
- [ ] Bug fix (restores intended behavior)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] Infrastructure/tooling

## Checklist

### Before Submitting

- [ ] Ran `/code-review` and addressed all critical issues
- [ ] All tasks in `tasks.md` are checked off
- [ ] Tests pass locally (`npm test` and `npm run test:e2e`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)
- [ ] Code follows project conventions (see `openspec/project.md`)

### Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if applicable)
- [ ] E2E tests added/updated (if applicable)
- [ ] Test coverage ≥80% for new code
- [ ] Manual testing completed

### Security & Performance

- [ ] RLS policies added for new tables
- [ ] Input validation (Zod schemas) implemented
- [ ] Database indexes added where needed
- [ ] No secrets or API keys in code
- [ ] Performance tested (no slow queries >100ms)

### Documentation

- [ ] OpenSpec specs updated (if applicable)
- [ ] README updated (if needed)
- [ ] Comments added for complex logic
- [ ] Migration rollback tested (if database changes)

## Screenshots/Videos

[If UI changes, add screenshots or demo video]

## Performance Impact

- [ ] No significant performance impact
- [ ] Performance improved
- [ ] Performance degraded (explain why acceptable)

**Details**: [Describe any performance considerations]

## Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (list below)

**Breaking changes**:
- [List any breaking changes and migration path]

## Deployment Notes

[Any special deployment instructions, environment variables, or manual steps needed]

## Reviewer Checklist

- [ ] Code matches OpenSpec requirements
- [ ] Security review passed (RLS, validation, no secrets)
- [ ] Performance acceptable
- [ ] Tests are comprehensive
- [ ] Documentation is clear

---

**After review approval**: Archive the OpenSpec change with `/openspec:archive [change-id]`
