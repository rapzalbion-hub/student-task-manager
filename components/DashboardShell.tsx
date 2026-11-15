"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Role } from "@/lib/menus";

export default function DashboardShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <Topbar role={role} name={name} onMenu={() => setOpen(true)} />
        <main className="p-margin-mobile lg:p-margin">{children}</main>
      </div>
    </div>
  );
}
