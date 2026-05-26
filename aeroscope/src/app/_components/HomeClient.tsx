"use client";

import NextDynamic from "next/dynamic";

const AeroscopeApp = NextDynamic(
  () => import("@/components/aeroscope/AeroscopeApp"),
  {
    ssr: false,
    loading: () => null,
  },
);

export function HomeClient() {
  return <AeroscopeApp />;
}
