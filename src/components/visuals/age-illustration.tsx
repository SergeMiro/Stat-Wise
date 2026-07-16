import type { ChildAgeGroup } from "@/domain/types";

import { StatWiseIllustration } from "./statwise-illustration";

const AGE_IMAGES: Record<ChildAgeGroup, string> = {
  "0_2": "/illustrations/family/age-0-2.svg",
  "3_5": "/illustrations/family/age-3-5.svg",
  "6_10": "/illustrations/family/age-6-10.svg",
  "11_14": "/illustrations/family/age-11-14.svg",
  "15_17": "/illustrations/family/age-15-17.svg",
};

export function AgeIllustration({ age }: { age: ChildAgeGroup }) {
  return (
    <StatWiseIllustration
      src={AGE_IMAGES[age]}
      alt=""
      width={400}
      height={300}
      className="mx-auto max-w-[320px]"
    />
  );
}
