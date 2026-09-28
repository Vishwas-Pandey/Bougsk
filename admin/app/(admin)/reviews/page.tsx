"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/formatDate";
import { useStore } from "@/lib/store";

type Filter = "all" | "published" | "unpublished";

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Unpublished", value: "unpublished" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-sand">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const { reviews, products, setReviewPublished } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  const productName = (id: string) =>
    products.find((p) => p.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    const wantPublished = filter === "published";
    return reviews.filter((r) => r.is_published === wantPublished);
  }, [reviews, filter]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-h1 text-ink mb-8">Reviews</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-body transition-colors duration-300 ease-out ${
              filter === f.value
                ? "bg-ink text-paper"
                : "bg-sand text-ink/70 hover:bg-sand/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card border border-sand bg-white px-6 py-12 text-center text-body text-ink/60">
          No reviews in this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-sand rounded-card p-6 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-h3-italic italic text-ink">
                    {productName(review.product_id)}
                  </p>
                  <p className="text-body text-ink/60">{review.customer_name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating} />
                  {review.is_verified_purchase && (
                    <Badge tone="sage">Verified purchase</Badge>
                  )}
                  <Badge tone={review.is_published ? "sage" : "neutral"}>
                    {review.is_published ? "Published" : "Unpublished"}
                  </Badge>
                </div>
              </div>
              {review.review_text && (
                <p className="text-body text-ink">{review.review_text}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-body text-ink/40">
                  {formatDate(review.created_at)}
                </span>
                <Button
                  type="button"
                  variant={review.is_published ? "ghost" : "secondary"}
                  onClick={() =>
                    setReviewPublished(review.id, !review.is_published)
                  }
                >
                  {review.is_published ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
