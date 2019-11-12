import mockContext from "@reactioncommerce/api-utils/tests/mockContext.js";
import ReactionError from "@reactioncommerce/reaction-error";
import navigationItemsByShopIdQuery from "./navigationItemsByShopId.js";

const query = { shopId: "123" };

test("calls NavigationItems.find and returns a navigation item", async () => {
  mockContext.collections.NavigationItems.find.mockReturnValueOnce("NAVIGATIONITEM");
  const result = await navigationItemsByShopIdQuery(mockContext, "123");
  expect(result).toBe("NAVIGATIONITEM");
  expect(mockContext.collections.NavigationItems.find).toHaveBeenCalledWith(query);
});

test("throws an error if the user does not have the core permission", async () => {
  mockContext.checkPermissions.mockImplementation(() => {
    throw new ReactionError("access-denied", "Access Denied");
  });
  const result = navigationItemsByShopIdQuery(mockContext, "123");
  expect(result).rejects.toThrow();
});
