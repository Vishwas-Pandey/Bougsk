"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/FormControls";
import { Toggle } from "@/components/Toggle";
import { DEFAULT_CARE_INSTRUCTIONS } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import type { Category, Product, ProductVariant } from "@/lib/types";

export type ProductFormValues = Omit<
  Product,
  "id" | "slug" | "created_at" | "is_active"
>;

export function ProductForm({
  categories,
  initialProduct,
  onSave,
  onToggleLive,
  onDelete,
  saveLabel = "Save product",
}: {
  categories: Category[];
  initialProduct?: Product;
  onSave: (values: ProductFormValues) => void;
  onToggleLive?: (value: boolean) => void;
  onDelete?: () => void;
  saveLabel?: string;
}) {
  const { productVariants, getSetting, addProductVariant, updateProductVariant } =
    useStore();

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id ?? categories[0]?.id ?? ""
  );
  const [description, setDescription] = useState(
    initialProduct?.description ?? ""
  );
  const [scentNotesText, setScentNotesText] = useState(
    initialProduct?.scent_notes.join(", ") ?? ""
  );
  const [ingredients, setIngredients] = useState(
    initialProduct?.ingredients ?? ""
  );
  const [burnTimeHours, setBurnTimeHours] = useState(
    String(initialProduct?.burn_time_hours ?? "")
  );
  const [weightGrams, setWeightGrams] = useState(
    String(initialProduct?.weight_grams ?? "")
  );
  const [priceInr, setPriceInr] = useState(
    String(initialProduct?.price_inr ?? "")
  );
  const [compareAtPriceInr, setCompareAtPriceInr] = useState(
    initialProduct?.compare_at_price_inr != null
      ? String(initialProduct.compare_at_price_inr)
      : ""
  );
  const [stockQuantity, setStockQuantity] = useState(
    String(initialProduct?.stock_quantity ?? "")
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProduct?.is_featured ?? false
  );
  const [imageNames, setImageNames] = useState<string[]>(
    initialProduct?.image_paths ?? []
  );
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [hsnCode, setHsnCode] = useState(initialProduct?.hsn_code ?? "");
  const [careInstructions, setCareInstructions] = useState(
    initialProduct?.care_instructions ?? ""
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialProduct?.low_stock_threshold != null
      ? String(initialProduct.low_stock_threshold)
      : ""
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Variant management only applies once the product exists (it needs a
  // product_id to attach to) — new products save as a draft first, then get
  // variants added from their edit page, same as the "Live" toggle below.
  const variants = initialProduct
    ? productVariants.filter((v) => v.product_id === initialProduct.id)
    : [];
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("");
  const [newVariantSku, setNewVariantSku] = useState("");

  function handleAddVariant() {
    if (!initialProduct || !newVariantName.trim()) return;
    addProductVariant({
      product_id: initialProduct.id,
      name: newVariantName.trim(),
      price_inr: Number(newVariantPrice) || 0,
      stock_quantity: Number(newVariantStock) || 0,
      sku: newVariantSku.trim(),
      is_active: true,
    });
    setNewVariantName("");
    setNewVariantPrice("");
    setNewVariantStock("");
    setNewVariantSku("");
    setShowAddVariant(false);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    // Real call goes here: upload each File to the `product-images` Supabase
    // Storage bucket and store the returned storage paths in image_paths.
    setImageNames((prev) => [...prev, ...Array.from(files).map((f) => f.name)]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      category_id: categoryId,
      name,
      description,
      scent_notes: scentNotesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ingredients,
      burn_time_hours: Number(burnTimeHours) || 0,
      weight_grams: Number(weightGrams) || 0,
      price_inr: Number(priceInr) || 0,
      compare_at_price_inr: compareAtPriceInr ? Number(compareAtPriceInr) : null,
      stock_quantity: Number(stockQuantity) || 0,
      is_featured: isFeatured,
      image_paths: imageNames,
      sku: sku.trim() || undefined,
      hsn_code: hsnCode.trim() || undefined,
      care_instructions: careInstructions.trim() || undefined,
      low_stock_threshold: lowStockThreshold ? Number(lowStockThreshold) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      <section className="bg-white border border-sand rounded-card p-6 flex flex-col gap-5">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Amber & Oud"
            required
          />
        </Field>
        <Field label="Category">
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="A few sentences on what makes this one worth lighting."
          />
        </Field>
        <Field label="Scent notes" hint="Separate each note with a comma">
          <Input
            value={scentNotesText}
            onChange={(e) => setScentNotesText(e.target.value)}
            placeholder="Amber, Oud, Sandalwood"
          />
        </Field>
        <Field label="Ingredients">
          <Textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={2}
            placeholder="Coconut-soy wax blend, cotton wick, phthalate-free fragrance oil"
          />
        </Field>
        <Field
          label="Care instructions"
          hint={
            careInstructions.trim()
              ? "Overriding the site-wide default for this candle."
              : "Using the site-wide default — override here if this candle needs different wording."
          }
        >
          <Textarea
            value={careInstructions}
            onChange={(e) => setCareInstructions(e.target.value)}
            rows={5}
            placeholder={String(
              getSetting("default_care_instructions") ?? DEFAULT_CARE_INSTRUCTIONS
            )}
          />
        </Field>
      </section>

      <section className="bg-white border border-sand rounded-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Burn time (hours)">
          <Input
            type="number"
            min={0}
            value={burnTimeHours}
            onChange={(e) => setBurnTimeHours(e.target.value)}
          />
        </Field>
        <Field label="Weight (grams)">
          <Input
            type="number"
            min={0}
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
          />
        </Field>
        <Field label="Price (₹)">
          <Input
            type="number"
            min={0}
            value={priceInr}
            onChange={(e) => setPriceInr(e.target.value)}
            required
          />
        </Field>
        <Field label="Compare-at price (₹)" hint="Leave blank if not discounted">
          <Input
            type="number"
            min={0}
            value={compareAtPriceInr}
            onChange={(e) => setCompareAtPriceInr(e.target.value)}
          />
        </Field>
        <Field label="Stock quantity">
          <Input
            type="number"
            min={0}
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
          />
        </Field>
        <Field
          label="Low-stock threshold"
          hint={
            lowStockThreshold
              ? "Overrides the site-wide default below this many units."
              : "Blank uses the site-wide default from Settings."
          }
        >
          <Input
            type="number"
            min={0}
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
          />
        </Field>
        <Field
          label="SKU"
          hint={
            variants.length > 0
              ? "This product has variants — each variant carries its own SKU instead."
              : "Only used while this product has no variants."
          }
        >
          <Input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="FIG-CEDAR-200"
          />
        </Field>
        <Field label="HSN code" hint="For GST invoices">
          <Input
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            placeholder="3406"
          />
        </Field>
      </section>

      <section className="bg-white border border-sand rounded-card p-6">
        <Toggle
          checked={isFeatured}
          onChange={setIsFeatured}
          label="Feature on the storefront"
          description="Shown in the featured rail on the home page."
        />
      </section>

      <section className="bg-white border border-sand rounded-card p-6">
        <span className="block text-label-upper uppercase tracking-[0.08em] font-semibold text-ink/70 mb-3">
          Images
        </span>
        <label className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-sand py-10 cursor-pointer hover:border-gold transition-colors duration-300 ease-out">
          <span className="text-body text-ink/70">
            Drop images here, or click to choose files
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        {imageNames.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-4">
            {imageNames.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 text-body text-ink"
              >
                {name}
                <button
                  type="button"
                  onClick={() =>
                    setImageNames((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-ink/50 hover:text-error"
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-sand rounded-card p-6">
        <span className="block text-label-upper uppercase tracking-[0.08em] font-semibold text-ink/70 mb-3">
          Variants
        </span>
        {!initialProduct ? (
          <p className="text-body text-ink/50">
            Save this product first, then add variants from its edit page.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {variants.length === 0 && !showAddVariant && (
              <p className="text-body text-ink/50">
                No variants yet — this product sells at the single price and
                SKU above.
              </p>
            )}
            {variants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                onToggleActive={(value) =>
                  updateProductVariant(variant.id, { is_active: value })
                }
              />
            ))}
            {showAddVariant ? (
              <div className="rounded-card border border-sand p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Variant name">
                  <Input
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder="Travel Tin, 90g"
                  />
                </Field>
                <Field label="SKU">
                  <Input
                    value={newVariantSku}
                    onChange={(e) => setNewVariantSku(e.target.value)}
                    placeholder="AMB-OUD-TIN-90"
                  />
                </Field>
                <Field label="Price (₹)">
                  <Input
                    type="number"
                    min={0}
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(e.target.value)}
                  />
                </Field>
                <Field label="Stock quantity">
                  <Input
                    type="number"
                    min={0}
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                  />
                </Field>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <Button type="button" variant="secondary" onClick={handleAddVariant}>
                    Add variant
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddVariant(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddVariant(true)}
                className="self-start"
              >
                Add a variant
              </Button>
            )}
          </div>
        )}
      </section>

      {onToggleLive && initialProduct && (
        <section className="bg-white border border-sand rounded-card p-6">
          <Toggle
            checked={initialProduct.is_active}
            onChange={onToggleLive}
            label={initialProduct.is_active ? "Live on the storefront" : "Hidden as a draft"}
            description="Taking a product live is separate from saving its details below — it publishes immediately."
          />
        </section>
      )}

      {!onToggleLive && (
        <section className="bg-white border border-sand rounded-card p-6">
          <Toggle
            checked={false}
            disabled
            onChange={() => {}}
            label="Hidden as a draft"
            description="New products start as drafts. Save this one, then take it live from its edit page when it's ready."
          />
        </section>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button type="submit" variant="primary">
          {saveLabel}
        </Button>
        {onDelete && (
          <div className="flex items-center gap-3">
            {confirmingDelete && (
              <span className="text-body text-ink/60">Delete this product?</span>
            )}
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmingDelete) {
                  onDelete();
                } else {
                  setConfirmingDelete(true);
                }
              }}
            >
              {confirmingDelete ? "Yes, delete" : "Delete"}
            </Button>
            {confirmingDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

function VariantRow({
  variant,
  onToggleActive,
}: {
  variant: ProductVariant;
  onToggleActive: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-sand px-4 py-3">
      <div>
        <p className="text-body text-ink">{variant.name}</p>
        <p className="text-body text-ink/50">
          {variant.sku || "No SKU"} · ₹{variant.price_inr} · {variant.stock_quantity} in stock
        </p>
      </div>
      <Toggle
        checked={variant.is_active}
        onChange={onToggleActive}
        label={variant.is_active ? "Active" : "Retired"}
      />
    </div>
  );
}
