import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const AddAccountAddressBookEntryMutation = importAsString("./AddAccountAddressBookEntryMutation.graphql");

jest.setTimeout(300000);

let testApp;
let addAccountAddressBookEntry;
beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  await testApp.insertPrimaryShop();
  addAccountAddressBookEntry = testApp.mutate(AddAccountAddressBookEntryMutation);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

const accountInternalId = "123";
const accountOpaqueId = "cmVhY3Rpb24vYWNjb3VudDoxMjM=";

test("user can add an address to their own address book", async () => {
  await testApp.setLoggedInUser({ _id: accountInternalId });

  const address = Factory.AccountProfileAddress.makeOne();

  // These props are set by the server and not allowed on AddressInput
  delete address._id;
  delete address.failedValidation;

  let result;
  try {
    result = await addAccountAddressBookEntry({ accountId: accountOpaqueId, address });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.addAccountAddressBookEntry.address).toEqual(address);

  const account = await testApp.collections.Accounts.findOne({ userId: accountInternalId });
  const savedAddress = account.profile.addressBook[0];
  delete savedAddress._id;
  expect(savedAddress).toEqual(address);
});
