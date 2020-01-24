import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const TaxCodesQuery = importAsString("./TaxCodesQuery.graphql");

jest.setTimeout(300000);

const shopId = "123";
const opaqueShopId = encodeOpaqueId("reaction/shop", shopId); // reaction/shop:123
const shopName = "Test Shop";
let testApp;
let taxCodes;

const mockGlobalSetting = {
  shopId,
  primaryTaxServiceName: "custom-rates"
};

const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [shopId]: ["owner"]
  },
  shopId
});

beforeAll(async () => {
  testApp = new TestApp();

  await testApp.start();
  await testApp.insertPrimaryShop({ _id: shopId, name: shopName });
  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.collections.AppSettings.insertOne(mockGlobalSetting);

  taxCodes = testApp.query(TaxCodesQuery);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("an anonymous user cannot view tax codes", async () => {
  try {
    await taxCodes({
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toMatchSnapshot();
    return;
  }
});

test("an admin user can view tax codes", async () => {
  let result;
  await testApp.setLoggedInUser(mockAdminAccount);

  try {
    result = await taxCodes({
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.taxCodes[0].code).toEqual("RC_TAX");
  expect(result.taxCodes[0].label).toEqual("Taxable (RC_TAX)");
});
