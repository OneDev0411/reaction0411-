import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const RolesQuery = importAsString("./RolesQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = encodeOpaqueId("reaction/shop", internalShopId); // reaction/shop:123
const shopName = "Test Shop";
let testApp;
let roles;

const adminGroup = Factory.Group.makeOne({
  _id: "adminGroup",
  createdBy: null,
  name: "admin",
  permissions: ["reaction:legacy:shops/read"],
  slug: "admin",
  shopId: internalShopId
});

const mockShopOwnerAccount = Factory.Account.makeOne({
  groups: [adminGroup._id],
  shopId: internalShopId
});

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.createUserAndAccount(mockShopOwnerAccount);
  roles = testApp.query(RolesQuery);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("an anonymous user cannot view user roles ", async () => {
  try {
    await roles({
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toMatchSnapshot();
    return;
  }
});

test("a shop owner can view all user roles", async () => {
  let result;
  await testApp.setLoggedInUser(mockShopOwnerAccount);

  try {
    result = await roles({
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.roles.nodes[0].name).toEqual(jasmine.any(String));
});
