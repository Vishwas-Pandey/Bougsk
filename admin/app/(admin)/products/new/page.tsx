"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { useStore } from "@/lib/store";

export default function NewProductPage() {
  const router = useRouter();
  const { categories, addProduct } = useStore();

  return (
    <div>
      <h1 className="font-display text-h1 text-ink mb-8">New product</h1>
      <ProductForm
        categories={categories}
        saveLabel="Save product"
        onSave={(values) => {
          const product = addProduct({ ...values, is_active: false });
          router.push(`/products/${product.id}/edit`);
        }}
      />
    </div>
  );
}
