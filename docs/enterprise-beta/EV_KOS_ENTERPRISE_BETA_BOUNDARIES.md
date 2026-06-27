# EV-KOS Enterprise Beta Tenant Boundaries

EB-2 maps tenant and operator boundaries before enforcement.

## Required Boundaries

- Organization scope.
- Workspace scope.
- Approval scope.
- Operator identity.
- Role and permission context.

## Boundary Rule

Future runtime routes must reject ambiguous tenant scope before allowing reads,
writes, publication preparation, graph updates, or operator actions. EB-2 does
not implement that rejection path; it only defines the contract.
