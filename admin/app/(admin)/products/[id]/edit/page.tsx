"use client";

import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { ProductForm } from "@/components/ProductForm";
import { useStore } from "@/lib/store";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { categories, products, updateProduct, deleteProduct } = useStore();

  const product = products.find((p) => p.id === params.id);

  if (!product) {
    return (
      <div>
        <h1 className="font-display text-h1 text-ink mb-4">
          Product not found
        </h1>
        <p className="text-body text-ink/60">
          It may have been deleted already.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-display text-h1 text-ink">{product.name}</h1>
        <Badge tone={product.is_active ? "sage" : "neutral"}>
          {product.is_active ? "Live" : "Draft"}
        </Badge>
      </div>
      <ProductForm
        categories={categories}
        initialProduct={product}
        saveLabel="Save changes"
        onSave={(values) => updateProduct(product.id, values)}
        onToggleLive={(value) => updateProduct(product.id, { is_active: value })}
        onDelete={() => {
          deleteProduct(product.id);
          router.push("/products");
        }}
      />
    </div>
  );
}
