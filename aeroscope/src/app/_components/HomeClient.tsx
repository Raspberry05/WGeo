"use client";

import NextDynamic from "next/dynamic";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const AeroscopeApp = NextDynamic(
  () => import("@/components/aeroscope/AeroscopeApp"),
  {
    ssr: false,
    loading: () => <LoadingOverlay message="Loading globe…" />,
  },
);

export function HomeClient() {
  return <AeroscopeApp />;
}
