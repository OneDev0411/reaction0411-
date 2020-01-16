import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const flatRateFulfillmentMethodQuery = importAsString("./flatRateFulfillmentMethodQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const fulfillmentMethodDocs = [];
const shopName = "Test Shop";

const groups = ["Standard", "Priority", "Next-Day"];

for (let index = 10; index < 40; index += 1) {
  const group = groups[Math.floor(index / 10) - 1];

  const mockMethod = {
    _id: `method-${index}`,
    name: `method-${index}`,
    shopId: internalShopId,
    label: `${group} ${index}`,
    handling: index * 0.5,
    rate: index * 10,
    cost: index * 5,
    isEnabled: true,
    fulfillmentTypes: ["shipping"],
    group
  };

  fulfillmentMethodDocs.push(mockMethod);
}

let testApp;
let queryFulfillmentMethod;

const adminGroup = Factory.Group.makeOne({
  _id: "adminGroup",
  createdBy: null,
  name: "admin",
  permissions: ["reaction:legacy:shippingMethods/read"],
  slug: "admin",
  shopId: internalShopId
});

const customerGroup = Factory.Group.makeOne({
  _id: "customerGroup",
  createdBy: null,
  name: "customer",
  permissions: ["customer"],
  slug: "customer",
  shopId: internalShopId
});

const mockAdminAccount = Factory.Account.makeOne({
  groups: [adminGroup._id],
  shopId: internalShopId
});

const mockCustomerAccount = Factory.Account.makeOne({
  groups: [customerGroup._id],
  shopId: internalShopId
});

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  queryFulfillmentMethod = testApp.query(flatRateFulfillmentMethodQuery);
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.collections.Groups.insertOne(customerGroup);

  await testApp.createUserAndAccount(mockCustomerAccount);
  await testApp.createUserAndAccount(mockAdminAccount);

  await Promise.all(fulfillmentMethodDocs.map((doc) => (
    testApp.collections.Shipping.insertOne(doc)
  )));
});

afterAll(async () => {
  await testApp.collections.Shops.deleteMany({});
  await testApp.collections.Shipping.deleteMany({});
  await testApp.collections.Groups.deleteMany({});
  await testApp.clearLoggedInUser();
  await testApp.stop();
});

test("expect a fulfillment method", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  let result;

  try {
    result = await queryFulfillmentMethod({
      methodId: encodeOpaqueId("reaction/fulfillmentMethod", "method-11"),
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.flatRateFulfillmentMethod.label).toEqual("Standard 11");
});

test("throws access-denied when getting a fulfillment method if not an admin", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await queryFulfillmentMethod({
      methodId: encodeOpaqueId("reaction/fulfillmentMethod", "method-35"),
      shopId: opaqueShopId
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
    return;
  }
});
