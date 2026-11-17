import { prisma } from "@/server/db/prisma";

export interface VerifyPosteSessionInput {
  tenantId: string;
  storeId?: string;
  fingerprint: string;
  deviceName?: string;
  os?: string;
  platform?: string;
}

export interface PosteSessionResult {
  status: "ACTIVE" | "DUAL_LOCKDOWN" | "HARD_ADMIN_LOCK" | "GRACE_RECOVERED";
  isPrimary: boolean;
  strikes: number;
  graceRecovered?: boolean;
  bindingId?: string;
  primarySummary?: {
    name?: string | null;
    os?: string | null;
    boundAt?: Date | null;
    lastHeartbeat?: Date | null;
  };
  secondarySummary?: {
    name?: string | null;
    os?: string | null;
    lastConflict?: Date | null;
  };
  message?: string;
}

/**
 * Verifies the physical seat binding for a tenant slot.
 * Enforces:
 * 1. Permanent hardware binding to PC #1 (even when offline).
 * 2. Instant DUAL_LOCKDOWN the moment PC #2 connects on a 1-Poste quota.
 * 3. Customer-First Clean Shutdown Grace Recovery for PC #1 alone.
 * 4. Immediate re-lock if PC #2 attempts connection again.
 * 5. 3-Strike escalation to HARD_ADMIN_LOCK.
 */
export async function verifyPosteSession(
  input: VerifyPosteSessionInput
): Promise<PosteSessionResult> {
  const { tenantId, storeId, fingerprint, deviceName, os } = input;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, maxDevices: true, displayName: true },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const maxDevices = tenant.maxDevices || 1;

  // Find or create primary Slot #1 binding
  let binding = await prisma.posteBinding.findUnique({
    where: {
      tenantId_slotIndex: {
        tenantId,
        slotIndex: 1,
      },
    },
  });

  // If no binding exists for Slot #1, bind permanently to this first device!
  if (!binding) {
    binding = await prisma.posteBinding.create({
      data: {
        tenantId,
        storeId: storeId || null,
        slotIndex: 1,
        primaryFingerprint: fingerprint,
        primaryDeviceName: deviceName || "POS Primary",
        primaryOs: os || "windows",
        primaryBoundAt: new Date(),
        status: "ACTIVE",
        conflictStrikes: 0,
        lastPrimaryHeartbeatAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "POSTE_SLOT_BOUND_PRIMARY",
        entityType: "PosteBinding",
        entityId: binding.id,
        afterState: {
          slotIndex: 1,
          primaryFingerprint: fingerprint,
          deviceName,
          os,
        },
      },
    });

    return {
      status: "ACTIVE",
      isPrimary: true,
      strikes: 0,
      bindingId: binding.id,
      message: "Primary hardware slot bound successfully",
    };
  }

  const isPrimary = binding.primaryFingerprint === fingerprint;

  // ==========================================
  // CASE 1: DEVICE IS ORIGINAL BOUND PC #1
  // ==========================================
  if (isPrimary) {
    // Check if locked under HARD_ADMIN_LOCK (3+ strikes)
    if (binding.status === "HARD_ADMIN_LOCK") {
      return {
        status: "HARD_ADMIN_LOCK",
        isPrimary: true,
        strikes: binding.conflictStrikes,
        bindingId: binding.id,
        primarySummary: {
          name: binding.primaryDeviceName,
          os: binding.primaryOs,
          boundAt: binding.primaryBoundAt,
        },
        secondarySummary: {
          name: binding.secondaryDeviceName,
          os: binding.secondaryOs,
          lastConflict: binding.lastConflictAt,
        },
        message: "Session locked due to repeated multi-device policy triggers. Contact support or add an extra poste.",
      };
    }

    // Check if in DUAL_LOCKDOWN -> evaluate Clean Shutdown Grace Recovery
    if (binding.status === "DUAL_LOCKDOWN") {
      const now = Date.now();
      const lastSecondaryMs = binding.lastSecondaryHeartbeatAt
        ? new Date(binding.lastSecondaryHeartbeatAt).getTime()
        : 0;
      const secondaryClosedMs = binding.secondarySessionClosedAt
        ? new Date(binding.secondarySessionClosedAt).getTime()
        : 0;

      // Secondary PC is considered offline if:
      // a) It cleanly closed its session (beacon received >= last heartbeat) OR
      // b) Its heartbeat is stale (> 90 seconds old) OR
      // c) No secondary heartbeat has been recorded.
      const isSecondaryOffline =
        !binding.lastSecondaryHeartbeatAt ||
        now - lastSecondaryMs > 90_000 ||
        (secondaryClosedMs > 0 && secondaryClosedMs >= lastSecondaryMs - 5000);

      // Customer-First Clean Shutdown Grace Recovery Condition:
      // Secondary PC is offline AND conflictStrikes < 3 (grace window)
      if (isSecondaryOffline && binding.conflictStrikes < 3) {
        // Recover grace automatically!
        const updated = await prisma.posteBinding.update({
          where: { id: binding.id },
          data: {
            status: "ACTIVE",
            graceRecoveredAt: new Date(),
            lastPrimaryHeartbeatAt: new Date(),
            primarySessionClosedAt: null,
          },
        });

        await prisma.auditLog.create({
          data: {
            tenantId,
            action: "POSTE_CONFLICT_GRACE_RECOVERED",
            entityType: "PosteBinding",
            entityId: binding.id,
            afterState: {
              fingerprint,
              conflictStrikes: updated.conflictStrikes,
              graceRecoveredAt: updated.graceRecoveredAt,
              reason: "Clean shutdown & solitary primary PC boot",
            },
          },
        });

        return {
          status: "ACTIVE",
          isPrimary: true,
          graceRecovered: true,
          strikes: updated.conflictStrikes,
          bindingId: binding.id,
          message: "Session recovered automatically under clean shutdown grace.",
        };
      }

      // Secondary PC is still actively connected or strikes >= 3
      return {
        status: "DUAL_LOCKDOWN",
        isPrimary: true,
        strikes: binding.conflictStrikes,
        bindingId: binding.id,
        primarySummary: {
          name: binding.primaryDeviceName,
          os: binding.primaryOs,
          boundAt: binding.primaryBoundAt,
        },
        secondarySummary: {
          name: binding.secondaryDeviceName,
          os: binding.secondaryOs,
          lastConflict: binding.lastConflictAt,
        },
        message: "Dual-device conflict detected. Another device attempted to access this 1-Poste license.",
      };
    }

    // Normal active heartbeat for PC #1
    await prisma.posteBinding.update({
      where: { id: binding.id },
      data: {
        lastPrimaryHeartbeatAt: new Date(),
        primarySessionClosedAt: null,
      },
    });

    return {
      status: "ACTIVE",
      isPrimary: true,
      strikes: binding.conflictStrikes,
      bindingId: binding.id,
    };
  }

  // ==========================================
  // CASE 2: DEVICE IS A SECOND DEVICE (PC #2)
  // ==========================================

  // If the merchant pays for multiple postes (maxDevices > 1), Slot #2 is legally licensed!
  if (maxDevices > 1) {
    return {
      status: "ACTIVE",
      isPrimary: false,
      strikes: 0,
      bindingId: binding.id,
      message: "Licensed multi-device seat active",
    };
  }

  // Quota is 1-Poste (200 MAD/mo) and PC #2 is attempting to operate!
  // Trigger INSTANT DUAL_LOCKDOWN!
  const newStrikes = binding.conflictStrikes + 1;
  const newStatus = newStrikes >= 3 ? "HARD_ADMIN_LOCK" : "DUAL_LOCKDOWN";

  const updatedBinding = await prisma.posteBinding.update({
    where: { id: binding.id },
    data: {
      status: newStatus,
      conflictStrikes: newStrikes,
      secondaryFingerprint: fingerprint,
      secondaryDeviceName: deviceName || "Unauthorized Secondary PC",
      secondaryOs: os || "unknown",
      lastConflictAt: new Date(),
      lastSecondaryHeartbeatAt: new Date(),
      secondarySessionClosedAt: null,
    },
  });

  // Create immutable audit log
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: newStatus === "HARD_ADMIN_LOCK" ? "POSTE_HARD_ADMIN_LOCK" : "POSTE_DUAL_LOCKDOWN",
      entityType: "PosteBinding",
      entityId: binding.id,
      afterState: {
        primaryFingerprint: binding.primaryFingerprint,
        secondaryFingerprint: fingerprint,
        secondaryDeviceName: deviceName,
        secondaryOs: os,
        conflictStrikes: newStrikes,
        status: newStatus,
      },
    },
  });

  return {
    status: newStatus,
    isPrimary: false,
    strikes: newStrikes,
    bindingId: updatedBinding.id,
    primarySummary: {
      name: binding.primaryDeviceName,
      os: binding.primaryOs,
      boundAt: binding.primaryBoundAt,
    },
    secondarySummary: {
      name: deviceName || "Unauthorized Secondary PC",
      os,
      lastConflict: updatedBinding.lastConflictAt,
    },
    message:
      newStatus === "HARD_ADMIN_LOCK"
        ? "Hard admin lock triggered: Maximum strikes exceeded."
        : "Dual-device conflict triggered: 1-Poste quota exceeded.",
  };
}

/**
 * Handles clean session close beacon (navigator.sendBeacon / Tauri window close).
 */
export async function handleCleanSessionClose(
  tenantId: string,
  fingerprint: string
): Promise<void> {
  const binding = await prisma.posteBinding.findUnique({
    where: {
      tenantId_slotIndex: {
        tenantId,
        slotIndex: 1,
      },
    },
  });

  if (!binding) return;

  const now = new Date();
  if (binding.primaryFingerprint === fingerprint) {
    await prisma.posteBinding.update({
      where: { id: binding.id },
      data: { primarySessionClosedAt: now },
    });
  } else if (binding.secondaryFingerprint === fingerprint) {
    await prisma.posteBinding.update({
      where: { id: binding.id },
      data: { secondarySessionClosedAt: now },
    });
  }
}

/**
 * SuperAdmin actions for resolving conflict tickets.
 */
export async function resolveConflictTicket(
  ticketId: string,
  action: "UNLOCK_PRIMARY" | "AUTHORIZE_NEW_PC" | "REQUIRE_EXTRA_POSTE" | "SUSPEND",
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  const ticket = await prisma.supportConflictTicket.findUnique({
    where: { id: ticketId },
    include: { posteBinding: true },
  });

  if (!ticket || !ticket.posteBinding) {
    throw new Error("Conflict ticket or binding not found");
  }

  const binding = ticket.posteBinding;
  const now = new Date();

  if (action === "UNLOCK_PRIMARY") {
    await prisma.posteBinding.update({
      where: { id: binding.id },
      data: {
        status: "ACTIVE",
        conflictStrikes: 0,
        secondaryFingerprint: null,
        secondaryDeviceName: null,
        secondaryOs: null,
      },
    });
    await prisma.supportConflictTicket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        resolutionAction: action,
        adminNotes,
        resolvedAt: now,
      },
    });
    return { success: true, message: "Primary PC unlocked and strikes reset to 0." };
  }

  if (action === "AUTHORIZE_NEW_PC") {
    if (!binding.secondaryFingerprint) {
      throw new Error("No secondary device recorded to authorize");
    }
    await prisma.posteBinding.update({
      where: { id: binding.id },
      data: {
        primaryFingerprint: binding.secondaryFingerprint,
        primaryDeviceName: binding.secondaryDeviceName,
        primaryOs: binding.secondaryOs,
        primaryBoundAt: now,
        secondaryFingerprint: null,
        secondaryDeviceName: null,
        secondaryOs: null,
        status: "ACTIVE",
        conflictStrikes: 0,
      },
    });
    await prisma.supportConflictTicket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED",
        resolutionAction: action,
        adminNotes,
        resolvedAt: now,
      },
    });
    return { success: true, message: "New PC authorized as the official primary terminal." };
  }

  if (action === "REQUIRE_EXTRA_POSTE") {
    await prisma.supportConflictTicket.update({
      where: { id: ticketId },
      data: {
        status: "ESCALATED",
        resolutionAction: action,
        adminNotes: adminNotes || "Merchant must upgrade plan (+150 MAD/mo) to unlock both devices.",
      },
    });
    return { success: true, message: "Ticket marked as requiring +1 extra poste." };
  }

  if (action === "SUSPEND") {
    await prisma.posteBinding.update({
      where: { id: binding.id },
      data: { status: "HARD_ADMIN_LOCK" },
    });
    await prisma.supportConflictTicket.update({
      where: { id: ticketId },
      data: {
        status: "REJECTED",
        resolutionAction: action,
        adminNotes,
        resolvedAt: now,
      },
    });
    return { success: true, message: "Account suspended under hard admin lock." };
  }

  throw new Error("Invalid resolution action");
}
