"use client";

import React from "react";
import { HEYUKAPlatformShell } from "./HEYUKAPlatformShell";
import { PlatformOverviewView } from "./PlatformOverviewView";

export function XZebraPlatformPortal() {
  return (
    <HEYUKAPlatformShell activeNav="overview">
      <PlatformOverviewView />
    </HEYUKAPlatformShell>
  );
}

export default XZebraPlatformPortal;
