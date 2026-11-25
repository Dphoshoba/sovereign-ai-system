# Calendar Connector — Operations Manual

## Quick Start

1. Implement OAuth adapter
2. Implement API client  
3. Implement resource parser
4. Implement action set
5. Run tests

## Troubleshooting

### Token Expiration
OAuth adapter auto-detects and refreshes expired tokens (< 10 min).

### Rate Limiting
API client enforces quotas with backoff: 10s → 30s → 60s

### Resource Validation
Parser validates ID and name; logs errors in audit trail.

### Action Execution
All actions queued by default. Set ENABLE_REAL_EXECUTION=true to execute.

## Monitoring

- Check status: `GET /api/connectors/calendar/status`
- Review logs in database audit trail
- Test health: `npm run connector:validate -- --name=calendar`

## Safety Checklist

- [ ] OAuth tokens masked in logs
- [ ] No credentials in environment
- [ ] Approval workflow tested
- [ ] Rate limits appropriate
- [ ] All tests passing (95%+)
- [ ] GitHub Actions CI passing
