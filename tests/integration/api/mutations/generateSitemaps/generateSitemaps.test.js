import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const GenerateSitemapsMutation = importAsString("./generateSitemaps.graphql");

jest.setTimeout(300000);

const shopId = "123";
const opaqueShopId = encodeOpaqueId("reaction/shop", shopId); // reaction/shop:123
const shopName = "Test Shop";

const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [shopId]: ["reaction:legacy:shops/update"]
  },
  shopId
});

let testApp;
let generateSitemaps;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: shopId, name: shopName });

  await testApp.createUserAndAccount(mockAdminAccount);
  generateSitemaps = testApp.mutate(GenerateSitemapsMutation);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("generate sitemaps", async () => {
  let result;
  await testApp.setLoggedInUser(mockAdminAccount);

  try {
    result = await generateSitemaps({
      input: {
        shopId: opaqueShopId
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  const createdJob = await testApp.collections.Jobs.findOne({
    "type": "sitemaps/generate",
    "data.shopId": shopId
  });

  expect(createdJob.data.shopId).toEqual(shopId);
  expect(result.generateSitemaps.wasJobScheduled).toEqual(true);
});
