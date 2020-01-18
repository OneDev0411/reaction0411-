import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const CreateFlatRateFulfillmentMethodMutation = importAsString("./CreateFlatRateFulfillmentMethodMutation.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";

const groups = ["Standard", "Priority", "Next-Day"];

const mockFulfillmentMethodInput = {
  name: "mockMethod",
  label: `${groups[0]} mockMethod`,
  handling: 9.5,
  rate: 90,
  cost: 9,
  isEnabled: true,
  fulfillmentTypes: ["shipping"],
  group: groups[0]
};

const adminGroup = Factory.Group.makeOne({
  _id: "adminGroup",
  createdBy: null,
  name: "admin",
  permissions: ["reaction:legacy:shippingMethods/create"],
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

const mockCustomerAccount = Factory.Account.makeOne({
  groups: [customerGroup._id],
  shopId: internalShopId
});

const mockAdminAccount = Factory.Account.makeOne({
  groups: [adminGroup._id],
  shopId: internalShopId
});

let testApp;
let createFlatRateFulfillmentMethod;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  createFlatRateFulfillmentMethod = testApp.mutate(CreateFlatRateFulfillmentMethodMutation);
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.collections.Groups.insertOne(customerGroup);
});

afterAll(async () => {
  await testApp.collections.Shops.deleteMany({});
  await testApp.collections.Shipping.deleteMany({});
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.users.deleteMany({});
  await testApp.collections.Groups.deleteMany({});
  await testApp.clearLoggedInUser();
  await testApp.stop();
});

afterEach(async () => {
  await testApp.clearLoggedInUser();
});

test("user can not create flat rate fulfillment method if admin is not logged in", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await createFlatRateFulfillmentMethod({
      input: {
        shopId: opaqueShopId,
        method: mockFulfillmentMethodInput
      }
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }
});

test("user can create flat rate fulfillment method if admin is logged in", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  let result;

  try {
    result = await createFlatRateFulfillmentMethod({
      input: {
        shopId: opaqueShopId,
        method: mockFulfillmentMethodInput
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.createFlatRateFulfillmentMethod.method).toEqual(mockFulfillmentMethodInput);
});


