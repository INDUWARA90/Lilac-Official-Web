import Image from "next/image";

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/Lailac.png"
      alt="Lilac"
      width={2434}
      height={811}
      priority
      className={className}
    />
  );
}
