import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import TestApp from "/tests/util/TestApp.js";

const productsQuery = importAsString("./productsQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const productDocuments = [];
const shopName = "Test Shop";

for (let index = 100; index < 136; index += 1) {
  const productId = `product-${index}`;
  const variantId = `variant-${index}`;
  const optionId = `option-${index}`;

  const mockProduct = {
    _id: productId,
    ancestors: [],
    title: `Fake Product ${index}`,
    shopId: internalShopId,
    isDeleted: false,
    isVisible: true,
    supportedFulfillmentTypes: ["shipping"],
    type: "simple",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockVariant = {
    _id: variantId,
    ancestors: [productId],
    attributeLabel: "Variant",
    title: `Fake Product Variant ${index}`,
    shopId: internalShopId,
    isDeleted: false,
    isVisible: true,
    type: "variant"
  };

  const mockOption = {
    _id: optionId,
    ancestors: [productId, variantId],
    attributeLabel: "Option",
    title: `Fake Product Option ${index}`,
    shopId: internalShopId,
    isDeleted: false,
    isVisible: true,
    type: "variant"
  };

  productDocuments.push(mockProduct);
  productDocuments.push(mockVariant);
  productDocuments.push(mockOption);
}

let testApp;
let queryProducts;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  queryProducts = testApp.query(productsQuery);
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await Promise.all(productDocuments.map((doc) => (
    testApp.collections.Products.insertOne(doc)
  )));

  await testApp.setLoggedInUser({
    _id: "123",
    roles: { [internalShopId]: ["createProduct"] }
  });
});

afterAll(async () => {
  await testApp.collections.Shops.deleteMany({});
  await testApp.collections.Products.deleteMany({});
  await testApp.clearLoggedInUser();
  await testApp.stop();
});

test("expect a list of products", async () => {
  let result;

  try {
    result = await queryProducts({
      shopIds: [opaqueShopId],
      first: 10
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.products.nodes.length).toEqual(10);
  expect(result.products.nodes[0].title).toEqual("Fake Product 100");
  expect(result.products.nodes[0].variants[0].title).toEqual("Fake Product Variant 100");
  expect(result.products.nodes[0].variants[0].options[0].title).toEqual("Fake Product Option 100");

  expect(result.products.nodes[9].title).toEqual("Fake Product 109");
  expect(result.products.nodes[9].variants[0].title).toEqual("Fake Product Variant 109");
  expect(result.products.nodes[9].variants[0].options[0].title).toEqual("Fake Product Option 109");
});

test("expect a list of products on the second page", async () => {
  let result;

  try {
    result = await queryProducts({
      shopIds: [opaqueShopId],
      first: 10,
      offset: 10
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.products.nodes.length).toEqual(10);
  expect(result.products.nodes[0].title).toEqual("Fake Product 110");
  expect(result.products.nodes[0].variants[0].title).toEqual("Fake Product Variant 110");
  expect(result.products.nodes[0].variants[0].options[0].title).toEqual("Fake Product Option 110");

  expect(result.products.nodes[9].title).toEqual("Fake Product 119");
  expect(result.products.nodes[9].variants[0].title).toEqual("Fake Product Variant 119");
  expect(result.products.nodes[9].variants[0].options[0].title).toEqual("Fake Product Option 119");
});

