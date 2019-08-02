import { registerComponent } from "@reactioncommerce/reaction-components";

import {
  ProductField,
  ProductTags,
  ProductMetadata,
  PriceRange,
  ProductNotFound,
  VariantList
} from "./components";

import { Divider } from "/imports/plugins/core/ui/client/components";

import {
  VariantListContainer
} from "./containers";

import {
  AlertContainer,
  MediaGalleryContainer
} from "/imports/plugins/core/ui/client/containers";


// Register PDP components and some others
registerComponent("ProductField", ProductField);
registerComponent("ProductTags", ProductTags);
registerComponent("ProductMetadata", ProductMetadata);
registerComponent("PriceRange", PriceRange);
registerComponent("AlertContainer", AlertContainer);
registerComponent("VariantList", VariantList);
registerComponent("MediaGalleryContainer", MediaGalleryContainer);
registerComponent("VariantListContainer", VariantListContainer);
registerComponent("Divider", Divider);
registerComponent("ProductNotFound", ProductNotFound);
