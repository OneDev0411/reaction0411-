import { encodeAccountOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/account";
import { encodeAddressOpaqueId } from "@reactioncommerce/reaction-graphql-xforms/address";
import mockContext from "/imports/test-utils/helpers/mockContext";
import removeAccountAddressBookEntry from "./removeAccountAddressBookEntry";

mockContext.mutations.removeAccountAddressBookEntry = jest.fn().mockName("mutations.removeAccountAddressBookEntry");

test("correctly passes through to internal mutation function", async () => {
  const accountId = encodeAccountOpaqueId("2");
  const addressId = encodeAddressOpaqueId("1");
  const removedAddress = { address1: "123 Main St" };

  mockContext.mutations.removeAccountAddressBookEntry.mockReturnValueOnce(Promise.resolve(removedAddress));

  const result = await removeAccountAddressBookEntry(null, {
    input: {
      accountId,
      addressId,
      clientMutationId: "clientMutationId"
    }
  }, mockContext);

  expect(mockContext.mutations.removeAccountAddressBookEntry).toHaveBeenCalledWith(
    mockContext,
    { decodedAccountId: "2", decodedAddressId: "1" }
  );

  expect(result).toEqual({
    address: removedAddress,
    clientMutationId: "clientMutationId"
  });
});
