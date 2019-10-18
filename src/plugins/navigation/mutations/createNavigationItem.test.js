import mockContext from "@reactioncommerce/api-utils/tests/mockContext.js";
import ReactionError from "@reactioncommerce/reaction-error";
import { NavigationItem as NavigationItemSchema } from "../simpleSchemas.js";
import createNavigationItemMutation from "./createNavigationItem.js";

test("calls NavigationItems.insert and returns an object that validates against the schema", async () => {
  mockContext.userHasPermission.mockReturnValueOnce(true);
  mockContext.queries.primaryShopId = jest.fn().mockName("queries.primaryShopId").mockReturnValueOnce(Promise.resolve("FAKE_SHOP_ID"));

  const navigationItem = await createNavigationItemMutation(mockContext, {});
  const validationContext = NavigationItemSchema.newContext();
  validationContext.validate(navigationItem);
  const isValid = validationContext.isValid();
  expect(isValid).toBe(true);
  expect(mockContext.collections.NavigationItems.insertOne).toHaveBeenCalled();
});

test("throws an error if the user does not have the core permission", async () => {
  mockContext.checkPermissions.mockImplementation(() => {
    throw new ReactionError("access-denied", "Access Denied");
  });
  const result = createNavigationItemMutation(mockContext, {});
  expect(result).rejects.toThrow();
});

test("throws an error if invalid JSON metadata is passed", async () => {
  const result = createNavigationItemMutation(mockContext, { metadata: "INVALID_JSON" });
  expect(result).rejects.toThrow();
});
