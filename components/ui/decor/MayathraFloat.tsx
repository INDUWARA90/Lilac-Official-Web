"use client";

import { useEffect, useState } from "react";
import { MayathraLogo } from "@/components/ui/decor/MayathraLogo";

export function MayathraFloat() {
  const [backToTopVisible, setBackToTopVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => setBackToTopVisible(window.scrollY > 500);
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={
        "artist-float pointer-events-none fixed right-0 z-30 size-28 select-none transition-[bottom] duration-300 sm:size-32 " +
        (backToTopVisible ? "bottom-[72px]" : "bottom-0")
      }
    >
      <MayathraLogo />
    </div>
  );
}
