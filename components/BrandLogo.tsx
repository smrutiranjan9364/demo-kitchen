"use client";

import Image from "next/image";
import { useState } from "react";

// Renders /logo.png, falling back to a styled text wordmark if the file is
// missing (so the header never shows a broken image). Drop the logo at
// public/logo.png and it appears automatically.
export default function BrandLogo({
  src = "/logo.png",
  width,
  height,
  imgClassName,
  priority,
  fallback,
}: {
  src?: string;
  width: number;
  height: number;
  imgClassName?: string;
  priority?: boolean;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt="Odia Kitchen"
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  );
}
