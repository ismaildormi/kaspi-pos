/**
 * KASPI GLOBAL BACKUP FABRIC (كسب) — Master Export
 */

export * from "./types";
export * from "./crypto";
export * from "./fabric";

import { GlobalBackupFabric } from "./fabric";

export function getGlobalBackupFabric(): GlobalBackupFabric {
  return GlobalBackupFabric.getInstance();
}
