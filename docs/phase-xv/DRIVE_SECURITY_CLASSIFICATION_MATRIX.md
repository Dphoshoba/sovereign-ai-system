# Drive Security Classification Matrix

## Overview
To ensure safe governance of Google Drive mutations, every resource encountered during Stage 1 must be classified according to its accessibility and sensitivity. This matrix prevents accidental exposure of restricted files and ensures high-risk mutations (e.g., changing a Restricted file to Public) are flagged for human review.

## Classification Levels
| Level | Description | Criteria |
| :--- | :--- | :--- |
| **Public** | Accessible to anyone with the link or via search. | `anyone` permission exists OR public link enabled. |
| **Organization** | Accessible to all members of the verified domain. | `domain` permission exists with appropriate scope. |
| **Shared** | Accessible to a specific set of users/groups. | Specific user emails present in ACL; no public/domain access. |
| **Restricted** | Only the owner and specifically invited users have access. | `role` is `owner` or `file` access is restricted to specific IDs. |
| **Sensitive** | Contains highly confidential data (PII, keys, legal). | Based on MIME type, filename keywords, or specific folder placement. |
| **Unknown** | Classification could not be determined. | API error or incomplete metadata. |

## Resource Metadata Requirements
For every classified resource, the connector MUST record the following metadata to support the classifier:

### 1. Identity & Ownership
- **Owner**: The email address of the resource owner.
- **Shared Drive**: Boolean indicating if the file resides in a Shared Drive (vs. My Drive).
- **Personal Drive**: Boolean indicating if the file resides in the user's personal space.

### 2. Permission Analysis
- **Permission Count**: Total number of entries in the ACL.
- **External Sharing**: Boolean indicating if any non-domain user has access.
- **Public Link**: Boolean indicating if a public link is active.
- **Domain Sharing**: Boolean indicating if the resource is shared with the entire organization.
- **Inherited Permissions**: Boolean indicating if permissions were inherited from a parent folder.
- **Effective Permissions**: The highest level of access the current authenticated user has.

### 3. Technical Context
- **MIME Type**: The precise Google MIME type (e.g., `application/vnd.google-apps.folder`).
- **Shortcut**: Boolean indicating if the resource is a shortcut to another file.
- **Size**: File size in bytes (used for risk scoring).

## Security Guardrails
- **Read-Only Enforcement**: The classifier must operate only on metadata. It MUST NOT attempt to read the content of a file to determine sensitivity (unless using the official Google Drive API classification labels).
- **Zero-Content Policy**: No file content, binary data, or stream is retrieved during Stage 1.
- **Audit Trace**: Every classification decision must be recorded in the read audit log.
