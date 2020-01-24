import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const TagQuery = importAsString("./TagQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";
const mockTags = Factory.Tag.makeMany(25, {
  _id: (index) => (index + 100).toString(),
  position: (index) => index + 100,
  shopId: internalShopId,
  slug: (index) => `slug${index + 100}`,
  isVisible: (index) => index < 20
});

const mockCustomerAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: []
  },
  shopId: internalShopId
});

const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: ["reaction:legacy:tags-inactive/read"]
  },
  shopId: internalShopId
});


let testApp;
let query;
beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  query = testApp.query(TagQuery);

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await Promise.all(mockTags.map((tag) => testApp.collections.Tags.insertOne(tag)));

  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.createUserAndAccount(mockCustomerAccount);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("should get a tag by ID", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  const tagId = encodeOpaqueId("reaction/tag", "101");
  let result;
  try {
    result = await query({
      slugOrId: tagId,
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tag._id).toEqual(tagId);
  expect(result.tag.slug).toEqual("slug101");
});

test("should get a tag by slug", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  let result;
  try {
    result = await query({
      slugOrId: "slug106",
      shopId: opaqueShopId
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tag._id).toEqual(encodeOpaqueId("reaction/tag", "106"));
  expect(result.tag.slug).toEqual("slug106");
});

test("should not show a hidden tag to a customer", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await query({
      slugOrId: "slug122",
      shopId: opaqueShopId
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
    return;
  }
});

test("should show a hidden tag to an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  let result;
  try {
    result = await query({
      slugOrId: "slug122",
      shopId: opaqueShopId,
      shouldIncludeInvisible: true
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tag.slug).toEqual("slug122");
});

test("should not show a hidden tag to an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  try {
    await query({
      slugOrId: "slug122",
      shopId: opaqueShopId,
      shouldIncludeInvisible: false
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
    return;
  }
});
