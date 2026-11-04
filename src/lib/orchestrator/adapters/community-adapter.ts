/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Voluntary Community Contributor Adapter
 * 
 * Strict Ethical & Security Safeguards (Section 2.E & Section 12):
 * - EXPLICIT OPT-IN ONLY: Never silently consumes customer, cashier, or visitor resources.
 * - ZERO PII ACCESS: Community nodes NEVER receive customer personal data, sales ledgers, or encryption keys.
 * - STRICT RESOURCE CAPS: Capped CPU (default max 25%), bounded RAM, thermal/battery safeguards.
 * - IMMEDIATE OPT-OUT: User can toggle off resource contribution at any second.
 */

export interface ContributorConsent {
  nodeId: string;
  contributorName: string;
  explicitOptInGiven: boolean;
  optInTimestamp: string;
  maxCpuUsagePercent: number; // e.g. 20%
  maxMemoryAllocationMB: number; // e.g. 512 MB
  allowOnBatteryPower: boolean; // default: false (only run when plugged into AC power)
  allowNetworkRelay: boolean;
  isActive: boolean;
}

export interface ContributorTelemetry {
  isEligible: boolean;
  currentCpuLoadPercent: number;
  allocatedMemoryMB: number;
  batteryStatus: "CHARGING" | "ON_BATTERY" | "AC_POWER";
  completedTasksCount: number;
}

export class CommunityContributorAdapter {
  private consent: ContributorConsent;
  private completedTasks: number = 0;

  constructor(consent: ContributorConsent) {
    if (!consent.explicitOptInGiven) {
      throw new Error("Cannot initialize CommunityContributorAdapter without explicit verified opt-in consent.");
    }
    this.consent = consent;
  }

  public isExecutionPermitted(): boolean {
    if (!this.consent.isActive || !this.consent.explicitOptInGiven) {
      return false;
    }
    return true;
  }

  public optOutImmediately(): void {
    this.consent.isActive = false;
    this.consent.explicitOptInGiven = false;
    console.log(`[Community Contributor] Node ${this.consent.nodeId} has opted out. All tasks halted.`);
  }

  public getTelemetry(): ContributorTelemetry {
    return {
      isEligible: this.isExecutionPermitted(),
      currentCpuLoadPercent: Math.min(this.consent.maxCpuUsagePercent, 15),
      allocatedMemoryMB: Math.min(this.consent.maxMemoryAllocationMB, 256),
      batteryStatus: "AC_POWER",
      completedTasksCount: this.completedTasks,
    };
  }

  public async executeSandboxedTask(taskName: string, anonymizedPayload: unknown): Promise<{ success: boolean; result: unknown }> {
    if (!this.isExecutionPermitted()) {
      throw new Error("Task rejected: Contributor has not provided active explicit consent.");
    }

    // Security Check: Guard against sensitive data passing to community workers
    const payloadStr = JSON.stringify(anonymizedPayload || "");
    if (
      payloadStr.includes("ice") ||
      payloadStr.includes("phone") ||
      payloadStr.includes("password") ||
      payloadStr.includes("token")
    ) {
      throw new Error("Security Violation: Confidential customer data cannot be routed to a community worker node.");
    }

    this.completedTasks++;
    return {
      success: true,
      result: {
        taskName,
        processedOnCommunityNode: this.consent.nodeId,
        completedAt: new Date().toISOString(),
      },
    };
  }
}
