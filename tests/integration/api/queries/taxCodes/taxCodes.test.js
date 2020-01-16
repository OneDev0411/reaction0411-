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

const adminGroup = Factory.Group.makeOne({
  _id: "adminGroup",
  createdBy: null,
  name: "admin",
  permissions: ["owner"],
  slug: "admin",
  shopId
});

const mockAdminAccount = Factory.Account.makeOne({
  groups: [adminGroup._id],
  shopId
});

beforeAll(async () => {
  testApp = new TestApp();

  await testApp.start();
  await testApp.insertPrimaryShop({ _id: shopId, name: shopName });
  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.collections.AppSettings.insertOne(mockGlobalSetting);

  taxCodes = testApp.query(TaxCodesQuery);
});

afterAll(async () => {
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.AppSettings.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  await testApp.collections.Groups.deleteMany({});
  await testApp.stop();
});

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
