import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const taxRatesQuery = importAsString("./taxRatesQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";
const taxRateDocuments = [];

for (let index = 10; index < 23; index += 1) {
  const doc = Factory.TaxRates.makeOne({
    _id: `taxRate-${index}`,
    region: "CA",
    rate: index / 100,
    shopId: internalShopId,
    country: "USA",
    postal: `90${index}`,
    taxCode: "CODE"
  });

  taxRateDocuments.push(doc);
}

const mockCustomerAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: []
  },
  shopId: internalShopId
});

const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: ["admin"]
  },
  shopId: internalShopId
});

let testApp;
let taxRates;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await Promise.all(taxRateDocuments.map((doc) => (
    testApp.collections.TaxRates.insertOne(doc)
  )));

  await testApp.createUserAndAccount(mockCustomerAccount);
  await testApp.createUserAndAccount(mockAdminAccount);

  taxRates = testApp.query(taxRatesQuery);
});

afterAll(async () => {
  await testApp.collections.TaxRates.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  await testApp.stop();
});

test("throws access-denied when getting taxRates if not an admin", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await taxRates({
      shopId: opaqueShopId
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }
});

test("returns TaxRates records if user is an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await taxRates({
    shopId: opaqueShopId,
    first: 5,
    offset: 0
  });
  expect(result.taxRates.nodes.length).toEqual(5);
  expect(result.taxRates.nodes[0].postal).toEqual("9010");
  expect(result.taxRates.nodes[4].postal).toEqual("9014");
});


test("returns TaxRates records on second page if user is an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await taxRates({
    shopId: opaqueShopId,
    first: 5,
    offset: 5
  });
  expect(result.taxRates.nodes.length).toEqual(5);
  expect(result.taxRates.nodes[0].postal).toEqual("9015");
  expect(result.taxRates.nodes[4].postal).toEqual("9019");
});
