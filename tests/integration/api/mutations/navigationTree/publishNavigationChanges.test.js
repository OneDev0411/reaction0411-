import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const PublishNavigationChangesMutation = importAsString("./PublishNavigationChangesMutation.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";
const encodeNavigationTreeOpaqueId = encodeOpaqueId("reaction/navigationTree");

const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: ["reaction:legacy:navigationTreeItems/publish"]
  }
});

const mockNavigationTree = Factory.NavigationTree.makeOne({
  _id: "1001",
  name: "Default Navigation",
  shopId: internalShopId,
  draftItems: Factory.NavigationTreeItem.makeMany(2, {
    isPrivate: false,
    isSecondary: false,
    isVisible: false
  }),
  items: []
});
const opaqueMockNavigationTreeId = encodeNavigationTreeOpaqueId(mockNavigationTree._id);


let testApp;
let publishNavigationChanges;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.setLoggedInUser(mockAdminAccount);
  await testApp.collections.NavigationTrees.insertOne(mockNavigationTree);

  publishNavigationChanges = testApp.mutate(PublishNavigationChangesMutation);
});

beforeEach(async () => {
  await testApp.clearLoggedInUser();
});

afterAll(async () => {
  await testApp.collections.NavigationItems.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  await testApp.stop();
});

test("an authorized user should be able to update the navigation tree", async () => {
  let result;
  try {
    await testApp.setLoggedInUser(mockAdminAccount);
    result = await publishNavigationChanges({
      input: {
        id: opaqueMockNavigationTreeId,
        shopId: opaqueShopId
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
  }

  const mockNavigationTreeItems = mockNavigationTree.draftItems.map((item) => ({
    expanded: item.expanded,
    isVisible: item.isVisible,
    isPrivate: item.isPrivate,
    isSecondary: item.isSecondary
  }));

  expect(result.publishNavigationChanges.navigationTree).toEqual({
    _id: encodeNavigationTreeOpaqueId(mockNavigationTree._id),
    items: mockNavigationTreeItems,
    hasUnpublishedChanges: false,
    name: "Default Navigation",
    shopId: opaqueShopId
  });
});

test("an unauthorized user should not be able to update the navigation tree", async () => {
  try {
    await publishNavigationChanges({
      input: {
        id: opaqueMockNavigationTreeId,
        shopId: opaqueShopId
      }
    });
  } catch (error) {
    expect(error).toMatchSnapshot();
  }
});
