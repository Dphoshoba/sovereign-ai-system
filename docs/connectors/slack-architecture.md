# Slack Connector Architecture

## Component Overview

```
OAuth Adapter → API Client → Resource Parser → Action Set → GAMMA Reader → Dashboard
```

| Component | Responsibility |
|-----------|-----------------|
| OAuth Adapter | Authorization & token management |
| API Client | HTTP communication with rate limits |
| Resource Parser | Validate and map responses |
| Action Set | Define and execute actions |
| GAMMA Reader | Time-based deterministic queries |
| Dashboard | UI for status and management |

## Safety Architecture

- **Token Masking**: All tokens masked in logs
- **Approval Gates**: Medium/high-risk actions require review
- **Feature Flags**: Execution controlled by ENABLE_REAL_EXECUTION
- **Determinism**: All time logic parameterized with currentTime
- **Audit Trail**: All operations logged
