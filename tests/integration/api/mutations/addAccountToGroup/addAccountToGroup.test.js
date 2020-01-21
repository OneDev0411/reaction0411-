import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const AddAccountToGroupMutation = importAsString("./AddAccountToGroupMutation.graphql");

jest.setTimeout(300000);

let accountOpaqueId;
let adminGroup;
let adminSecondaryGroup;
let addAccountToGroup;
let customerGroup;
let mockAdminAccount;
let mockOtherAccount;
let shopId;
let shopManagerGroup;
let shopManagerGroupOpaqueId;
let shopOpaqueId;
let testApp;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  shopId = await testApp.insertPrimaryShop();

  adminGroup = Factory.Group.makeOne({
    _id: "adminGroup",
    createdBy: null,
    name: "admin",
    permissions: ["shopManagerGroupPermission", "someOtherPermission", "customerGroupPermission", "reaction:legacy:groups/manage:accounts"],
    slug: "admin",
    shopId
  });

  await testApp.collections.Groups.insertOne(adminGroup);

  adminSecondaryGroup = Factory.Group.makeOne({
    _id: "adminSecondaryGroup",
    createdBy: null,
    name: "adminSecondaryGroup",
    permissions: ["incorrectPermissions"],
    slug: "adminSecondaryGroup",
    shopId
  });
  await testApp.collections.Groups.insertOne(adminSecondaryGroup);

  customerGroup = Factory.Group.makeOne({
    _id: "customerGroup",
    createdBy: null,
    name: "customer",
    permissions: ["customer"],
    slug: "customer",
    shopId
  });
  await testApp.collections.Groups.insertOne(customerGroup);

  mockAdminAccount = Factory.Account.makeOne({
    _id: "mockAdminAccount",
    groups: [adminGroup._id],
    shopId
  });
  await testApp.createUserAndAccount(mockAdminAccount);

  mockOtherAccount = Factory.Account.makeOne({
    _id: "mockOtherAccount",
    groups: [customerGroup._id],
    shopId
  });
  await testApp.createUserAndAccount(mockOtherAccount);

  shopManagerGroup = Factory.Group.makeOne({
    createdBy: null,
    name: "shop manager",
    permissions: ["admin", "shopManagerGroupPermission"],
    slug: "shop manager",
    shopId
  });
  await testApp.collections.Groups.insertOne(shopManagerGroup);

  customerGroup = Factory.Group.makeOne({
    createdBy: null,
    name: "customer",
    permissions: ["customerGroupPermission"],
    slug: "customer",
    shopId
  });
  await testApp.collections.Groups.insertOne(customerGroup);

  accountOpaqueId = encodeOpaqueId("reaction/account", mockOtherAccount._id);
  shopOpaqueId = encodeOpaqueId("reaction/shop", shopId);
  shopManagerGroupOpaqueId = encodeOpaqueId("reaction/group", shopManagerGroup._id);

  addAccountToGroup = testApp.mutate(AddAccountToGroupMutation);
});

afterAll(async () => {
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.users.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  await testApp.collections.Groups.deleteMany({});
  await testApp.stop();
});

beforeEach(async () => {
  await testApp.collections.Accounts.updateOne({ _id: mockOtherAccount._id }, {
    $set: {
      groups: []
    }
  });

  await testApp.collections.users.updateOne({ _id: mockOtherAccount._id }, {
    $set: {
      roles: {}
    }
  });
});

test("anyone can add account to group if they have `reaction:legacy:groups/manage:accounts` permissions", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await addAccountToGroup({ accountId: accountOpaqueId, groupId: shopManagerGroupOpaqueId });

  expect(result.addAccountToGroup.group).toEqual({
    _id: shopManagerGroupOpaqueId,
    createdAt: shopManagerGroup.createdAt.toISOString(),
    createdBy: null,
    description: shopManagerGroup.description,
    name: shopManagerGroup.name,
    permissions: shopManagerGroup.permissions,
    shop: {
      _id: shopOpaqueId
    },
    slug: shopManagerGroup.slug,
    updatedAt: shopManagerGroup.updatedAt.toISOString()
  });

  const account = await testApp.collections.Accounts.findOne({ _id: mockOtherAccount._id });
  expect(account.groups).toEqual([shopManagerGroup._id]);

  const user = await testApp.collections.users.findOne({ _id: mockOtherAccount._id });
  expect(user.roles[shopId]).toEqual(shopManagerGroup.permissions);
});

test("anyone cannot add account to group if they do not have `reaction:legacy:groups/manage:accounts` permissions", async () => {
  await testApp.setLoggedInUser(adminSecondaryGroup);

  const beforeUser = await testApp.collections.users.findOne({ _id: mockOtherAccount._id });
  expect(beforeUser.roles[shopId]).toBe(undefined);

  try {
    await addAccountToGroup({ accountId: accountOpaqueId, groupId: shopManagerGroupOpaqueId });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }

  const account = await testApp.collections.Accounts.findOne({ _id: mockOtherAccount._id });
  expect(account.groups.length).toBe(0);

  const user = await testApp.collections.users.findOne({ _id: mockOtherAccount._id });
  expect(user.roles[shopId]).toBe(undefined);
});
