import type { DriveResource } from "./resource-parser";
import { DriveSecurityAdapter } from "./security-adapter";
import { ResourceSecurityClassifier } from "../../platform/security/resource-security-classifier";

export class DriveMetadataReader {
  /**
   * Reads and normalizes Drive metadata while strictly prohibiting content retrieval.
   */
  static readMetadata(raw: unknown): {
    resource: DriveResource;
    security: any;
  } {
    // 1. Use DriveParser to normalize basic metadata
    const { DriveParser } = require("./resource-parser");
    const resource = DriveParser.parse(raw);

    // 2. Apply the generic platform classifier using the Drive-specific adapter
    const security = ResourceSecurityClassifier.classify(resource, (res) => 
      DriveSecurityAdapter.classify(res as DriveResource)
    );

    return {
      resource,
      security,
    };
  }
}
