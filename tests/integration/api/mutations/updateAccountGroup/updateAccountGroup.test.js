import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const AddAccountToGroupMutation = importAsString("./AddAccountToGroupMutation.graphql");
const UpdateAccountGroupMutation = importAsString("./UpdateAccountGroupMutation.graphql");

jest.setTimeout(300000);

let addAccountToGroup;
let customerGroup;
let guestGroup;
let mockAdminAccount;
let mockAdminAccountWithBadPermissions;
let mockCustomerAccount;
let ownerGroup;
let shopId;
let shopManagerGroup;
let shopOpaqueId;
let testApp;
let testGroup;
let updateAccountGroup;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  shopId = await testApp.insertPrimaryShop();
  shopOpaqueId = encodeOpaqueId("reaction/shop", shopId);

  addAccountToGroup = testApp.mutate(AddAccountToGroupMutation);
  updateAccountGroup = testApp.mutate(UpdateAccountGroupMutation);

  // Create users
  mockAdminAccount = Factory.Account.makeOne({
    _id: "mockAdminAccount",
    roles: {
      [shopId]: ["owner", "admin", "reaction:legacy:groups/read", "reaction:legacy:groups/update"]
    },
    shopId
  });

  mockAdminAccountWithBadPermissions = Factory.Account.makeOne({
    _id: "mockAdminAccountWithBadPermissions",
    roles: {
      [shopId]: ["admin"]
    },
    shopId
  });

  mockCustomerAccount = Factory.Account.makeOne({
    _id: "mockCustomerAccount",
    groups: [],
    shopId
  });

  // Create groups
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

  ownerGroup = Factory.Group.makeOne({
    _id: "ownerGroup",
    createdBy: null,
    name: "owner",
    permissions: ["owner"],
    slug: "owner",
    shopId
  });

  shopManagerGroup = Factory.Group.makeOne({
    _id: "shopManagerGroup",
    createdBy: null,
    name: "shop-manager",
    permissions: ["admin"],
    slug: "shop-manager",
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
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

beforeEach(async () => {
  // Create users
  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.createUserAndAccount(mockAdminAccountWithBadPermissions);
  await testApp.createUserAndAccount(mockCustomerAccount);
  await testApp.setLoggedInUser(mockAdminAccount);

  // Create groups
  await testApp.collections.Groups.insertOne(customerGroup);
  await testApp.collections.Groups.insertOne(guestGroup);
  await testApp.collections.Groups.insertOne(ownerGroup);
  await testApp.collections.Groups.insertOne(shopManagerGroup);
  await testApp.collections.Groups.insertOne(testGroup);

  // Add customer account to the testGroup
  await addAccountToGroup({
    accountId: encodeOpaqueId("reaction/account", "mockCustomerAccount"),
    groupId: encodeOpaqueId("reaction/group", "testGroup")
  });

  await testApp.clearLoggedInUser();
});

afterEach(async () => {
  await testApp.collections.Groups.deleteMany({});
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.users.deleteMany({});
});

test("a customer account should not be able to update groups", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "testGroup"),
        shopId: shopOpaqueId,
        group: {
          permissions: ["test-perm-4"]
        }
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
    return;
  }
});

test("an admin account should be able to update groups", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  let result;

  try {
    result = await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "testGroup"),
        shopId: shopOpaqueId,
        group: {
          permissions: ["test-perm-4"]
        }
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.updateAccountGroup.group.permissions).toEqual(["test-perm-4", "customer"]);
});

test("an admin account should not be able to change the slug of a default group if is doesn't match", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  try {
    await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "shopManagerGroup"),
        shopId: shopOpaqueId,
        group: {
          slug: "new-slug"
        }
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  try {
    await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "ownerGroup"),
        shopId: shopOpaqueId,
        group: {
          slug: "new-slug"
        }
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  try {
    await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "guestGroup"),
        shopId: shopOpaqueId,
        group: {
          slug: "new-slug"
        }
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  try {
    await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "customerGroup"),
        shopId: shopOpaqueId,
        group: {
          slug: "new-slug"
        }
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }
});

test("an admin account should not be able to change the slug of a default group unless it matches", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  let result;

  try {
    result = await updateAccountGroup({
      input: {
        groupId: encodeOpaqueId("reaction/group", "customerGroup"),
        shopId: shopOpaqueId,
        group: {
          name: "Customer PlusPlus",
          slug: "customer"
        }
      }
    });
  } catch (errors) {
    expect(errors).toMatchSnapshot();
  }

  expect(result.updateAccountGroup.group.name).toEqual("Customer PlusPlus");
  expect(result.updateAccountGroup.group.slug).toEqual("customer");
});
