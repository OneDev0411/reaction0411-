import decodeOpaqueIdForNamespace from "@reactioncommerce/api-utils/decodeOpaqueIdForNamespace.js";
import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const CatalogItemProductFullQuery = importAsString("./CatalogItemProductFullQuery.graphql");

const decodeCatalogProductOpaqueId = decodeOpaqueIdForNamespace("reaction/catalogProduct");
const decodeCatalogItemOpaqueId = decodeOpaqueIdForNamespace("reaction/catalogItem");
const decodeCatalogProductVariantOpaqueId = decodeOpaqueIdForNamespace("reaction/catalogProductVariant");

const internalShopId = "123";
const shopName = "Test Shop";

const mockTag = Factory.Tag.makeOne({
  shopId: internalShopId,
  slug: "2"
});

const mockCatalogItem = Factory.Catalog.makeOne({
  _id: "400",
  product: () =>
    Factory.CatalogProduct.makeOne({
      _id: "500",
      productId: "500",
      isDeleted: false,
      isVisible: true,
      tagIds: [mockTag._id],
      shopId: internalShopId,
      pricing: {
        USD: {
          compareAtPrice: 6.0,
          displayPrice: "2.99 - 4.99",
          maxPrice: 4.99,
          minPrice: 2.99,
          price: null
        }
      },
      media: [
        {
          priority: 1,
          productId: "500",
          variantId: null,
          URLs: {
            thumbnail: "/thumbnail",
            small: "/small",
            medium: "/medium",
            large: "/large",
            original: "/original"
          }
        }
      ],
      socialMetadata: [
        { service: "twitter", message: "twitterMessage" },
        { service: "facebook", message: "facebookMessage" },
        { service: "googleplus", message: "googlePlusMessage" },
        { service: "pinterest", message: "pinterestMessage" }
      ],
      variants: Factory.CatalogProductVariant.makeMany(1, {
        options: null,
        shopId: internalShopId,
        pricing: {
          USD: {
            compareAtPrice: 6.0,
            displayPrice: "2.99 - 4.99",
            maxPrice: 4.99,
            minPrice: 2.99,
            price: null
          }
        }
      })
    }),
  shopId: internalShopId
});

jest.setTimeout(300000);

let testApp;
let query;
beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  query = testApp.query(CatalogItemProductFullQuery);
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.collections.Tags.insertOne(mockTag);
  await testApp.collections.Catalog.insertOne(mockCatalogItem);
});

afterAll(async () => {
  await testApp.collections.Shops.deleteOne({ _id: internalShopId });
  await testApp.collections.Tags.deleteOne(mockTag);
  await testApp.collections.Catalog.deleteOne({ _id: mockCatalogItem._id });
  await testApp.stop();
});

test("get a catalog product by slug", async () => {
  let result;
  try {
    result = await query({ slugOrId: mockCatalogItem.product.slug });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(decodeCatalogItemOpaqueId(result.catalogItemProduct._id)).toEqual(mockCatalogItem._id);
  expect(decodeCatalogProductOpaqueId(result.catalogItemProduct.product._id)).toEqual(mockCatalogItem.product._id);
  expect(decodeCatalogProductVariantOpaqueId(result.catalogItemProduct.product.variants[0]._id))
    .toEqual(mockCatalogItem.product.variants[0]._id);
  expect(result.catalogItemProduct.product.socialMetadata).toEqual([
    { service: "twitter", message: "twitterMessage" },
    { service: "facebook", message: "facebookMessage" },
    { service: "googleplus", message: "googlePlusMessage" },
    { service: "pinterest", message: "pinterestMessage" }
  ]);
  expect(result.catalogItemProduct.product.media).toEqual([
    {
      priority: 1,
      productId: result.catalogItemProduct.product.productId,
      variantId: null,
      URLs: {
        thumbnail: "https://shop.fake.site/thumbnail",
        small: "https://shop.fake.site/small",
        medium: "https://shop.fake.site/medium",
        large: "https://shop.fake.site/large",
        original: "https://shop.fake.site/original"
      }
    }
  ]);
});

test("get a catalog product by ID", async () => {
  let result;
  try {
    result = await query({ slugOrId: encodeOpaqueId("reaction/catalogItem", mockCatalogItem._id) });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(decodeCatalogItemOpaqueId(result.catalogItemProduct._id)).toEqual(mockCatalogItem._id);
  expect(decodeCatalogProductOpaqueId(result.catalogItemProduct.product._id)).toEqual(mockCatalogItem.product._id);
  expect(decodeCatalogProductVariantOpaqueId(result.catalogItemProduct.product.variants[0]._id))
    .toEqual(mockCatalogItem.product.variants[0]._id);
  expect(result.catalogItemProduct.product.socialMetadata).toEqual([
    { service: "twitter", message: "twitterMessage" },
    { service: "facebook", message: "facebookMessage" },
    { service: "googleplus", message: "googlePlusMessage" },
    { service: "pinterest", message: "pinterestMessage" }
  ]);
  expect(result.catalogItemProduct.product.media).toMatchObject([
    {
      productId: result.catalogItemProduct.product.productId,
      URLs: {
        thumbnail: "https://shop.fake.site/thumbnail",
        small: "https://shop.fake.site/small",
        medium: "https://shop.fake.site/medium",
        large: "https://shop.fake.site/large",
        original: "https://shop.fake.site/original"
      }
    }
  ]);
});
