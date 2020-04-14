import mockContext from "@reactioncommerce/api-utils/tests/mockContext.js";
import createCatalogProduct, { restore as restore$createCatalogProduct, rewire$xformProduct } from "./createCatalogProduct";

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const internalCatalogItemId = "999";
const internalCatalogProductId = "999";
const internalProductId = "999";
const internalTagIds = ["923", "924"];
const internalVariantIds = ["875", "874"];

const productSlug = "fake-product";

const createdAt = new Date("2018-04-16T15:34:28.043Z");
const updatedAt = new Date("2018-04-17T15:34:28.043Z");

const mockVariants = [
  {
    _id: internalVariantIds[0],
    ancestors: [internalCatalogProductId],
    barcode: "barcode",
    createdAt,
    height: 0,
    index: 0,
    isDeleted: false,
    isVisible: true,
    length: 0,
    metafields: [
      {
        value: "value",
        namespace: "namespace",
        description: "description",
        valueType: "valueType",
        scope: "scope",
        key: "key"
      }
    ],
    minOrderQuantity: 0,
    optionTitle: "Untitled Option",
    originCountry: "US",
    shopId: internalShopId,
    sku: "sku",
    title: "Small Concrete Pizza",
    updatedAt,
    variantId: internalVariantIds[0],
    weight: 0,
    width: 0
  },
  {
    _id: internalVariantIds[1],
    ancestors: [internalCatalogProductId, internalVariantIds[0]],
    barcode: "barcode",
    createdAt,
    height: 2,
    index: 0,
    isDeleted: false,
    isVisible: true,
    length: 2,
    metafields: [
      {
        value: "value",
        namespace: "namespace",
        description: "description",
        valueType: "valueType",
        scope: "scope",
        key: "key"
      }
    ],
    minOrderQuantity: 0,
    optionTitle: "Awesome Soft Bike",
    originCountry: "US",
    shopId: internalShopId,
    sku: "sku",
    title: "One pound bag",
    updatedAt,
    variantId: internalVariantIds[1],
    weight: 2,
    width: 2
  }
];

const mockProduct = {
  _id: internalCatalogItemId,
  shopId: internalShopId,
  barcode: "barcode",
  createdAt,
  description: "description",
  facebookMsg: "facebookMessage",
  fulfillmentService: "fulfillmentService",
  googleplusMsg: "googlePlusMessage",
  height: 11.23,
  length: 5.67,
  metafields: [
    {
      value: "value",
      namespace: "namespace",
      description: "description",
      valueType: "valueType",
      scope: "scope",
      key: "key"
    }
  ],
  metaDescription: "metaDescription",
  minOrderQuantity: 5,
  originCountry: "originCountry",
  pageTitle: "pageTitle",
  parcel: {
    containers: "containers",
    length: 4.44,
    width: 5.55,
    height: 6.66,
    weight: 7.77
  },
  pinterestMsg: "pinterestMessage",
  productId: internalProductId,
  productType: "productType",
  shop: {
    _id: opaqueShopId
  },
  sku: "ABC123",
  supportedFulfillmentTypes: ["shipping"],
  handle: productSlug,
  hashtags: internalTagIds,
  title: "Fake Product Title",
  twitterMsg: "twitterMessage",
  type: "product-simple",
  updatedAt,
  mockVariants,
  vendor: "vendor",
  weight: 15.6,
  width: 8.4
};

const mockShop = {
  currency: "USD"
};

const mockCatalogProduct = {
  _id: "999",
  barcode: "barcode",
  createdAt,
  description: "description",
  height: 11.23,
  isDeleted: false,
  isVisible: false,
  length: 5.67,
  media: [],
  metaDescription: "metaDescription",
  metafields: [{
    description: "description",
    key: "key",
    namespace: "namespace",
    scope: "scope",
    value: "value",
    valueType: "valueType"
  }],
  originCountry: "originCountry",
  pageTitle: "pageTitle",
  parcel: {
    containers: "containers",
    height: 6.66,
    length: 4.44,
    weight: 7.77,
    width: 5.55
  },
  primaryImage: null,
  productId: "999",
  productType: "productType",
  shopId: "123",
  sku: "ABC123",
  slug: "fake-product",
  socialMetadata: [{
    message: "twitterMessage",
    service: "twitter"
  }, {
    message: "facebookMessage",
    service: "facebook"
  }, {
    message: "googlePlusMessage",
    service: "googleplus"
  }, {
    message: "pinterestMessage",
    service: "pinterest"
  }],
  supportedFulfillmentTypes: ["shipping"],
  tagIds: ["923", "924"],
  title: "Fake Product Title",
  type: "product-simple",
  updatedAt,
  variants: [{
    _id: "875",
    barcode: "barcode",
    createdAt,
    height: 0,
    index: 0,
    length: 0,
    media: [],
    metafields: [{
      description: "description",
      key: "key",
      namespace: "namespace",
      scope: "scope",
      value: "value",
      valueType: "valueType"
    }],
    minOrderQuantity: 0,
    optionTitle: "Untitled Option",
    options: [{
      _id: "874",
      barcode: "barcode",
      createdAt,
      height: 2,
      index: 0,
      length: 2,
      media: [],
      metafields: [{
        description: "description",
        key: "key",
        namespace: "namespace",
        scope: "scope",
        value: "value",
        valueType: "valueType"
      }],
      minOrderQuantity: 0,
      optionTitle: "Awesome Soft Bike",
      originCountry: "US",
      primaryImage: null,
      shopId: "123",
      sku: "sku",
      title: "One pound bag",
      updatedAt,
      variantId: "874",
      weight: 2,
      width: 2
    }],
    originCountry: "US",
    primaryImage: null,
    shopId: "123",
    sku: "sku",
    title: "Small Concrete Pizza",
    updatedAt,
    variantId: "875",
    weight: 0,
    width: 0
  }],
  vendor: "vendor",
  weight: 15.6,
  width: 8.4
};


mockContext.mutations.applyCustomPublisherTransforms = jest.fn().mockName("applyCustomPublisherTransforms");

afterAll(() => {
  restore$createCatalogProduct();
});

test("convert product object to catalog object", async () => {
  mockContext.collections.Products.toArray.mockReturnValueOnce(Promise.resolve(mockVariants));
  mockContext.collections.Shops.findOne.mockReturnValueOnce(Promise.resolve(mockShop));
  const spec = await createCatalogProduct(mockProduct, mockContext);

  expect(spec).toEqual(mockCatalogProduct);
});

test("calls functions of type publishProductToCatalog, which can mutate the catalog product", async () => {
  mockContext.collections.Products.toArray.mockReturnValueOnce(Promise.resolve(mockVariants));
  mockContext.collections.Shops.findOne.mockReturnValueOnce(Promise.resolve(mockShop));

  rewire$xformProduct(() => ({ mock: true }));

  mockContext.mutations.applyCustomPublisherTransforms.mockImplementation((_, obj) => {
    obj.foo = "bar";
  });

  const catalogProduct = await createCatalogProduct({}, mockContext);

  expect(catalogProduct).toEqual({ foo: "bar", mock: true });
  expect(mockContext.mutations.applyCustomPublisherTransforms).toHaveBeenCalledWith(mockContext, { foo: "bar", mock: true }, {
    product: {},
    shop: mockShop,
    variants: mockVariants
  });
});
