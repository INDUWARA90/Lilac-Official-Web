import Image from "next/image";

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
