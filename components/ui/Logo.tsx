import Image from "next/image";

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/Lailac.png"
      alt="Lilac"
      width={270}
      height={90}
      sizes="90px"
      priority
      className={className}
    />
  );
}
