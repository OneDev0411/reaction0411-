import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const discountCodesQuery = importAsString("./discountCodesQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";
const discountCodeDocuments = [];

for (let index = 10; index < 25; index += 1) {
  const doc = Factory.Discounts.makeOne({
    _id: `discountCode-${index}`,
    shopId: internalShopId,
    code: `${index}OFF`,
    label: `${index} Off`,
    description: `Take $${index} off on all orders over $${index}`,
    discount: `${index}`,
    discountMethod: "code",
    calculation: {
      method: "discount"
    },
    conditions: {
      accountLimit: 1,
      order: {
        min: index,
        startDate: "2019-11-14T18:30:03.658Z",
        endDate: "2021-01-01T08:00:00.000Z"
      },
      redemptionLimit: 0,
      audience: ["customer"],
      permissions: ["guest", "anonymous"],
      products: ["product-id"],
      tags: ["tag-id"],
      enabled: true
    },
    transactions: [{
      cartId: "cart-id",
      userId: "user-id",
      appliedAt: "2019-11-18T18:30:03.658Z"
    }]
  });

  discountCodeDocuments.push(doc);
}

const mockCustomerAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: []
  },
  shopId: internalShopId
});

const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: ["reaction:legacy:discounts/read"]
  },
  shopId: internalShopId
});

let testApp;
let discountCodes;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await Promise.all(discountCodeDocuments.map((doc) => (
    testApp.collections.Discounts.insertOne(doc)
  )));

  await testApp.createUserAndAccount(mockCustomerAccount);
  await testApp.createUserAndAccount(mockAdminAccount);

  discountCodes = testApp.query(discountCodesQuery);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("throws access-denied when getting discount codes if not an admin", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await discountCodes({
      shopId: opaqueShopId
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }
});

test("returns discount records if user is an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await discountCodes({
    shopId: opaqueShopId,
    first: 5,
    offset: 0
  });
  expect(result.discountCodes.nodes.length).toEqual(5);
  expect(result.discountCodes.nodes[0].code).toEqual("10OFF");
  expect(result.discountCodes.nodes[4].code).toEqual("14OFF");
});


test("returns discount records on second page if user is an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await discountCodes({
    shopId: opaqueShopId,
    first: 5,
    offset: 5
  });
  expect(result.discountCodes.nodes.length).toEqual(5);
  expect(result.discountCodes.nodes[0].code).toEqual("15OFF");
  expect(result.discountCodes.nodes[4].code).toEqual("19OFF");
});
