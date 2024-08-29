import { lazy } from "solid-js";

export const LazyFlex = lazy(
  () => import("alley-components/lib/components/flex"),
);

export const LazyInput = lazy(
  () => import("alley-components/lib/components/input"),
);
export const LazyTextArea = lazy(
  () => import("alley-components/lib/components/input/text-area"),
);

export const LazyButton = lazy(
  () => import("alley-components/lib/components/button"),
);

export const LazyCol = lazy(
  () => import("alley-components/lib/components/col"),
);

export const LazyRow = lazy(
  () => import("alley-components/lib/components/row"),
);

export const LazyDivider = lazy(
  () => import("alley-components/lib/components/divider"),
);

export const LazySpace = lazy(
  () => import("alley-components/lib/components/space"),
);
export const LazySpaceCompact = lazy(
  () => import("alley-components/lib/components/space/compact"),
);

export const LazyTooltip = lazy(
  () => import("alley-components/lib/components/tooltip"),
);

export const LazyTypography = lazy(
  () => import("alley-components/lib/components/typography"),
);

export const LazyText = lazy(
  () => import("alley-components/lib/components/typography/text"),
);

export const LazyTag = lazy(
  () => import("alley-components/lib/components/tag"),
);

export const LazyDialog = lazy(
  () => import("alley-components/lib/components/dialog"),
);

export const LazyLabel = lazy(
  () => import("alley-components/lib/components/label"),
);

export const LazyToast = lazy(
  () => import("alley-components/lib/components/toast"),
);

export const LazyAlert = lazy(
  () => import("alley-components/lib/components/alert"),
);
