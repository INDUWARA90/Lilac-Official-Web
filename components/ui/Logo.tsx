import Image from "next/image";

/**
 * Brand mark — the event name in Sinhala script (ලයිලැක්), supplied as
 * `public/Lailac.png` (1434×711). `className` sets the rendered height;
 * `w-auto` keeps the source's aspect ratio as it scales.
 */
export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/Lailac.png"
      alt="Lilac"
      width={1434}
      height={711}
      priority
      className={className}
    />
  );
}
