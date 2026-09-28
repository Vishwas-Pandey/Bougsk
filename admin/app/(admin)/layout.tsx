import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-10 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
