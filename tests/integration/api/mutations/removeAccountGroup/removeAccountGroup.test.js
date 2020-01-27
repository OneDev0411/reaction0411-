import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const RemoveAccountGroupMutation = importAsString("./RemoveAccountGroupMutation.graphql");

jest.setTimeout(300000);

let removeAccountGroup;
let adminGroup;
let adminSecondaryGroup;
let customerGroup;
let mockAdminAccount;
let mockAdminAccountWithBadPermissions;
let mockCustomerAccount;
let shopId;
let shopOpaqueId;
let testApp;
let testGroup;

let guestGroup;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  shopId = await testApp.insertPrimaryShop();
  shopOpaqueId = encodeOpaqueId("reaction/shop", shopId);

  removeAccountGroup = testApp.mutate(RemoveAccountGroupMutation);

  adminGroup = Factory.Group.makeOne({
    _id: "adminGroup",
    createdBy: null,
    name: "admin",
    permissions: ["reaction:legacy:groups/remove", "reaction:legacy:groups/manage:accounts"],
    slug: "admin",
    shopId
  });

  adminSecondaryGroup = Factory.Group.makeOne({
    _id: "adminSecondaryGroup",
    createdBy: null,
    name: "adminSecondaryGroup",
    permissions: ["incorrectPermissions"],
    slug: "adminSecondaryGroup",
    shopId
  });

  customerGroup = Factory.Group.makeOne({
    _id: "customerGroup",
    createdBy: null,
    name: "customer",
    permissions: ["customer"],
    slug: "customer",
    shopId
  });

  guestGroup = Factory.Group.makeOne({
    _id: "guestGroup",
    createdBy: null,
    name: "guest",
    permissions: ["guest"],
    slug: "guest",
    shopId
  });

  testGroup = Factory.Group.makeOne({
    _id: "testGroup",
    createdBy: null,
    description: "a group for testing purposes",
    name: "test-int-group",
    permissions: ["test-perm-1", "test-perm-2"],
    slug: "test-int-group",
    shopId
  });

  // Create accounts
  mockAdminAccount = Factory.Account.makeOne({
    _id: "mockAdminAccount",
    groups: [adminGroup._id],
    shopId
  });

  mockAdminAccountWithBadPermissions = Factory.Account.makeOne({
    _id: "mockAdminAccountWithBadPermissions",
    groups: [adminSecondaryGroup._id],
    shopId
  });

  mockCustomerAccount = Factory.Account.makeOne({
    _id: "mockCustomerAccount",
    groups: ["testGroup"],
    shopId
  });
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

beforeEach(async () => {
  // Create accounts
  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.createUserAndAccount(mockAdminAccountWithBadPermissions);
  await testApp.createUserAndAccount(mockCustomerAccount);
  await testApp.setLoggedInUser(mockAdminAccount);

  // Create groups
  await testApp.collections.Groups.insertOne(adminGroup);
  await testApp.collections.Groups.insertOne(adminSecondaryGroup);
  await testApp.collections.Groups.insertOne(customerGroup);
  await testApp.collections.Groups.insertOne(guestGroup);
  await testApp.collections.Groups.insertOne(testGroup);

  await testApp.clearLoggedInUser();
});

afterEach(async () => {
  await testApp.collections.Groups.deleteMany({});
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.users.deleteMany({});
});

test("a customer account should not be able to remove a group", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "testGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
    return;
  }
});

test("a user belonging to a group with `reaction:legacy:groups/remove` permissions should be able to remove a group", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  // Expect the Account to be moved to the customer group
  const beforeAccount = await testApp.context.collections.Accounts.findOne({ _id: "mockCustomerAccount" });
  expect(beforeAccount.groups).toEqual(["testGroup"]);

  let result;

  try {
    result = await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "testGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.removeAccountGroup.group._id).toEqual(encodeOpaqueId("reaction/group", "testGroup"));

  // Ensure the group was deleted
  const deletedGroup = await testApp.context.collections.Groups.findOne({ _id: testGroup });
  expect(deletedGroup).toBeNull();

  // Expect the Account to be moved to the customer group
  const afterAccount = await testApp.context.collections.Accounts.findOne({ _id: "mockCustomerAccount" });
  expect(afterAccount.groups).toEqual(["customerGroup"]);
});

test("an admin account cannot delete default groups, 'owner', 'shop manager', 'guest' or 'customer'", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  try {
    await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "shopManagerGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  try {
    await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "ownerGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  try {
    await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "guestGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  try {
    await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "customerGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }
});

test("an admin account cannot remove a group unless there is a default customer group", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  // Remove the default customer group directly with mongo.
  // This simulates a user manually deleting or somehow otherwise altering the default customer group in the database
  await testApp.collections.Groups.deleteOne({ _id: "customerGroup" });

  // Expect the Account to be moved to the customer group
  const beforeAccount = await testApp.context.collections.Accounts.findOne({ _id: "mockCustomerAccount" });
  expect(beforeAccount.groups).toEqual(["testGroup"]);

  try {
    await removeAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "testGroup"),
        shopId: shopOpaqueId
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
    return;
  }
});
