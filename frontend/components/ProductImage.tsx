import { FlameGlyph } from "./FlameGlyph";

// Stands in for real product photography (Supabase Storage `product-images` bucket,
// per the Build Spec) until a shoot exists. Warm gradient pulled from the brand palette
// so placeholders never look like an error state.
export function ProductImage({
  name,
  className = "",
  radius = "rounded-lg",
}: {
  name: string;
  className?: string;
  radius?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-sand to-wine/20 ${radius} ${className}`}
    >
      <FlameGlyph className="h-8 w-8 opacity-70" />
      <span className="sr-only">{name}</span>
    </div>
  );
}
