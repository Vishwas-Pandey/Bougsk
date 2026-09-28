"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Field, Input, Textarea } from "@/components/FormControls";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";

const emptyForm = { name: "", description: "", sort_order: "1" };

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description,
      sort_order: String(category.sort_order),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      sort_order: Number(form.sort_order) || 0,
    };
    if (editingId) {
      updateCategory(editingId, payload);
    } else {
      addCategory(payload);
    }
    resetForm();
  }

  return (
    <div>
      <h1 className="font-display text-h1 text-ink mb-8">Categories</h1>

      <div className="mb-8">
        <DataTable<Category>
          rows={[...categories].sort((a, b) => a.sort_order - b.sort_order)}
          rowKey={(c) => c.id}
          emptyMessage="No categories yet."
          columns={[
            { header: "Name", accessor: (c) => c.name },
            { header: "Slug", accessor: (c) => c.slug },
            { header: "Description", accessor: (c) => c.description },
            { header: "Order", accessor: (c) => c.sort_order },
            {
              header: "",
              accessor: (c) => (
                <Button variant="ghost" onClick={() => startEdit(c)}>
                  Edit
                </Button>
              ),
            },
          ]}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-sand rounded-card p-6 max-w-xl flex flex-col gap-5"
      >
        <h2 className="font-display text-h3-italic italic text-ink">
          {editingId ? "Edit category" : "Add category"}
        </h2>
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Seasonal Editions"
            required
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={2}
          />
        </Field>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({ ...f, sort_order: e.target.value }))
            }
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit">
            {editingId ? "Save changes" : "Add category"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
