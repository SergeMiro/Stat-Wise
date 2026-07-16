import Image from "next/image";

import { cn } from "@/lib/utils";

type StatWiseIllustrationProps = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function StatWiseIllustration({
  src,
  alt = "",
  width,
  height,
  className,
  priority = false,
}: StatWiseIllustrationProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(max-width: 768px) 100vw, 50vw"
      className={cn("h-auto w-full select-none", className)}
      draggable={false}
    />
  );
}
