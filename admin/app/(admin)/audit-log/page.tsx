"use client";

import { DataTable } from "@/components/DataTable";
import { formatDateTime } from "@/lib/formatDate";
import { useStore } from "@/lib/store";
import type { AdminAuditLog } from "@/lib/types";

function Diff({ oldValue, newValue }: { oldValue: unknown; newValue: unknown }) {
  return (
    <div className="font-mono text-[12px] leading-snug text-ink/70 flex flex-col gap-0.5">
      {oldValue !== undefined && (
        <span className="text-ink/50">− {JSON.stringify(oldValue)}</span>
      )}
      {newValue !== undefined && <span>+ {JSON.stringify(newValue)}</span>}
    </div>
  );
}

export default function AuditLogPage() {
  const { auditLogs } = useStore();

  // Append-only by design — mirrors the real audit_log table, which no
  // admin action anywhere in this app writes to directly. There is
  // deliberately no edit or delete control on this page.
  const sorted = [...auditLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <h1 className="font-display text-h1 text-ink mb-8">Audit log</h1>
      <DataTable<AdminAuditLog>
        rows={sorted}
        rowKey={(a) => a.id}
        emptyMessage="No admin actions recorded yet."
        columns={[
          {
            header: "When",
            accessor: (a) => formatDateTime(a.created_at),
          },
          { header: "Action", accessor: (a) => a.action },
          {
            header: "Entity",
            accessor: (a) => `${a.entity_type} · ${a.entity_id}`,
          },
          {
            header: "Change",
            accessor: (a) => (
              <Diff oldValue={a.old_value} newValue={a.new_value} />
            ),
          },
        ]}
      />
    </div>
  );
}
