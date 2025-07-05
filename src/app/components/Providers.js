"use client";

import { SessionProvider } from "next-auth/react";
import { ExamProvider } from "../contexts/ExamContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ExamProvider>
        {children}
      </ExamProvider>
    </SessionProvider>
  );
} 