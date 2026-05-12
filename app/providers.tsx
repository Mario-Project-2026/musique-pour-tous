"use client";

import { SessionProvider } from "next-auth/react";
import { PlayerProvider } from "@/lib/PlayerContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </SessionProvider>
  );
}
