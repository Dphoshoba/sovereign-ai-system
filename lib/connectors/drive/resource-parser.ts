import type {
  ResourceParser,
  ValidationResult,
} from "../../platform/connector-platform-sdk";

export interface DrivePermission {
  id: string;
  role: string;
  type: string;
  email?: string;
}

export interface DriveResource {
  id: string;
  name: string;
  mimeType: string;
  createdAt: Date;
  modifiedTime: Date;
  size: number | null;
  checksum: string | null;
  version: number | null;
  owners: string[];
  permissions: DrivePermission[];
  parents: string[];
  sharedDrive: boolean;
  inheritedPermissions: boolean;
  effectivePermissions: string;
}

export const DriveParser: ResourceParser<unknown, DriveResource> = {
  parse(raw: unknown): DriveResource {
    const record = raw as Record<string, unknown>;
    
    const parsePermissions = (p: unknown): DrivePermission[] => {
      if (!Array.isArray(p)) return [];
      return p.map(item => ({
        id: String(item?.id ?? ""),
        role: String(item?.role ?? ""),
        type: String(item?.type ?? ""),
        email: item?.email ? String(item.email) : undefined,
      }));
    };

    return {
      id: String(record["id"] ?? ""),
      name: String(record["name"] ?? ""),
      mimeType: String(record["mimeType"] ?? "application/octet-stream"),
      createdAt: new Date(String(record["createdTime"] ?? "1970-01-01T00:00:00.000Z")),
      modifiedTime: new Date(String(record["modifiedTime"] ?? "1970-01-01T00:00:00.000Z")),
      size: record["size"] ? Number(record["size"]) : null,
      checksum: record["md5Checksum"] ? String(record["md5Checksum"]) : null,
      version: record["version"] ? Number(record["version"]) : null,
      owners: Array.isArray(record["owners"]) ? record["owners"].map(String) : [],
      permissions: parsePermissions(record["permissions"]),
      parents: Array.isArray(record["parents"]) ? record["parents"].map(String) : [],
      sharedDrive: !!record["driveId"],
      inheritedPermissions: !!record["inheritedPermissions"],
      effectivePermissions: String(record["effectivePermissions"] ?? "viewer"),
    };
  },
  validate(resource: DriveResource): ValidationResult {
    const errors: string[] = [];
    if (!resource.id) errors.push("id is required");
    if (!resource.name) errors.push("name is required");
    if (!resource.mimeType) errors.push("mimeType is required");
    return { valid: errors.length === 0, errors, warnings: [] };
  },
  sanitize(resource: DriveResource): DriveResource {
    return {
      ...resource,
      owners: resource.owners.map((owner) =>
        owner.includes("@") ? owner.replace(/^(.).+(@.+)$/, "$1***$2") : owner
      ),
    };
  },
};
