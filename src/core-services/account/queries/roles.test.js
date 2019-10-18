import mockContext from "@reactioncommerce/api-utils/tests/mockContext.js";
import ReactionError from "@reactioncommerce/reaction-error";
import rolesQuery from "./roles.js";

beforeEach(() => {
  jest.resetAllMocks();
});

test("throws if permission check fails", async () => {
  mockContext.checkPermissions.mockImplementation(() => {
    throw new ReactionError("access-denied", "Access Denied");
  });
  await expect(rolesQuery(mockContext)).rejects.toThrowErrorMatchingSnapshot();
  expect(mockContext.checkPermissions).toHaveBeenCalledWith(["owner", "admin"], mockContext.shopId);
});

test("returns roles cursor if user has permission", async () => {
  mockContext.checkPermissions.mockReturnValueOnce(Promise.resolve(null));
  mockContext.collections.roles.find.mockReturnValueOnce("CURSOR");
  const result = await rolesQuery(mockContext);
  expect(mockContext.checkPermissions).toHaveBeenCalledWith(["owner", "admin"], mockContext.shopId);
  expect(mockContext.collections.roles.find).toHaveBeenCalledWith({});
  expect(result).toBe("CURSOR");
});
