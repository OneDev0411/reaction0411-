import Factory from "/tests/util/factory.js";
import { ReactionAPICore } from "@reactioncommerce/api-core";
import insertPrimaryShop from "@reactioncommerce/api-utils/tests/insertPrimaryShop.js";

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";
const mockTags = Factory.Tag.makeMany(25, {
  _id: (index) => (index + 100).toString(),
  position: (index) => index + 100,
  shopId: internalShopId,
  slug: (index) => `slug${index + 100}`
});

const tagsQuery = `query ($shopId: ID!, $after: ConnectionCursor, $before: ConnectionCursor, $first: ConnectionLimitInt, $last: ConnectionLimitInt) {
  tags(shopId: $shopId, after: $after, before: $before, first: $first, last: $last) {
    totalCount
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    nodes {
      _id
      position
    }
  }
}`;

let testApp;
let query;
beforeAll(async () => {
  testApp = new ReactionAPICore();
  await testApp.start();
  query = testApp.query(tagsQuery);

  const customerGroup = Factory.Group.makeOne({
    _id: "customerGroup",
    createdBy: null,
    name: "customer",
    permissions: ["customer"],
    slug: "customer",
    shopId: internalShopId
  });
  await testApp.collections.Groups.insertOne(customerGroup);

  await testApp.setLoggedInUser({
    _id: "123",
    groups: [customerGroup._id]
  });

  await insertPrimaryShop(testApp.context, { _id: internalShopId, name: shopName });
  await Promise.all(mockTags.map((tag) => testApp.collections.Tags.insertOne(tag)));
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("get the first 20 tags when neither first or last is in query", async () => {
  let result;
  try {
    result = await query({ shopId: opaqueShopId });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(20);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: "MTE5", hasNextPage: true, hasPreviousPage: false, startCursor: "MTAw" });

  try {
    result = await query({ shopId: opaqueShopId, after: result.tags.pageInfo.endCursor });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(5);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: "MTI0", hasNextPage: false, hasPreviousPage: true, startCursor: "MTIw" });

  // Ensure it's also correct when we pass `first: 5` explicitly
  try {
    result = await query({ shopId: opaqueShopId, after: "MTE5", first: 5 });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(5);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: "MTI0", hasNextPage: false, hasPreviousPage: true, startCursor: "MTIw" });
});

test("get the last 10 tags when last is in query and before last item in list", async () => {
  let result;
  try {
    result = await query({ shopId: opaqueShopId, last: 10, before: "MTI0" });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(10);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: "MTIz", hasNextPage: true, hasPreviousPage: true, startCursor: "MTE0" });

  try {
    result = await query({ shopId: opaqueShopId, last: 10, before: result.tags.pageInfo.startCursor });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(10);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: "MTEz", hasNextPage: true, hasPreviousPage: true, startCursor: "MTA0" });

  try {
    result = await query({ shopId: opaqueShopId, last: 4, before: result.tags.pageInfo.startCursor });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(4);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: "MTAz", hasNextPage: true, hasPreviousPage: false, startCursor: "MTAw" });
});

test("works correctly when last goes before start", async () => {
  let result;
  try {
    result = await query({ shopId: opaqueShopId, last: 5, before: "MTAw" });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.tags.nodes.length).toBe(0);
  expect(result.tags.totalCount).toBe(25);
  expect(result.tags.pageInfo).toEqual({ endCursor: null, hasNextPage: true, hasPreviousPage: false, startCursor: null });
});
