import Factory from "/imports/test-utils/helpers/factory";
import enablePaymentMethodForShop from "./enablePaymentMethodForShop";
import mockContext from "/imports/test-utils/helpers/mockContext";
import paymentMethods from "../queries/paymentMethods";

jest.mock("/imports/plugins/core/core/server/no-meteor/pluginRegistration", () => ({
  paymentMethods: {
    mockPaymentMethod: {
      name: "mockPaymentMethod",
      displayName: "Mock!",
      pluginName: "mock-plugin"
    }
  }
}));

const fakeShop = Factory.Shop.makeOne();
const mockShopById = jest.fn().mockName("shopById");
const mockEnablePaymentMethod = jest.fn().mockName("enablePaymentMethodForShop");

beforeAll(() => {
  mockContext.queries = {
    paymentMethods,
    shopById: mockShopById
  };
  mockContext.mutations = { enablePaymentMethodForShop: mockEnablePaymentMethod };
});

beforeEach(() => {
  jest.resetAllMocks();
  mockShopById.mockClear();
  mockEnablePaymentMethod.mockClear();
  fakeShop.availablePaymentMethods = [];
});

test("throws if userHasPermission returns false", async () => {
  mockContext.userHasPermission.mockReturnValue(false);
  mockShopById.mockReturnValue(fakeShop);

  await expect(enablePaymentMethodForShop(mockContext, mockContext.shopId)).rejects.toThrowErrorMatchingSnapshot();
});

test("errors on missing arguments", async () => {
  mockContext.userHasPermission.mockReturnValue(true);
  mockShopById.mockReturnValue(fakeShop);

  await expect(enablePaymentMethodForShop(mockContext, {})).rejects.toThrowErrorMatchingSnapshot();
});

test("errors on invalid payment method", async () => {
  mockContext.userHasPermission.mockReturnValue(true);
  mockShopById.mockReturnValue(fakeShop);

  await expect(enablePaymentMethodForShop(mockContext, {
    shopId: fakeShop._id,
    paymentMethodName: "does not exist",
    isEnabled: true
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("errors on invalid shop", async () => {
  mockContext.userHasPermission.mockReturnValue(true);
  mockShopById.mockReturnValue();

  await expect(enablePaymentMethodForShop(mockContext, {
    shopId: "does not exist",
    paymentMethodName: "mockPaymentMethod",
    isEnabled: true
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("enables payment method for valid shop", async () => {
  mockContext.userHasPermission.mockReturnValue(true);
  mockShopById.mockReturnValue(fakeShop);

  await expect(enablePaymentMethodForShop(mockContext, {
    shopId: fakeShop._id,
    paymentMethodName: "mockPaymentMethod",
    isEnabled: true
  })).resolves.toEqual([{
    name: "mockPaymentMethod",
    displayName: "Mock!",
    pluginName: "mock-plugin",
    isEnabled: true
  }]);
});

test("disables payment method for valid shop", async () => {
  mockContext.userHasPermission.mockReturnValue(true);
  mockShopById.mockReturnValue(fakeShop);

  await expect(enablePaymentMethodForShop(mockContext, {
    shopId: fakeShop._id,
    paymentMethodName: "mockPaymentMethod",
    isEnabled: false
  })).resolves.toEqual([{
    name: "mockPaymentMethod",
    displayName: "Mock!",
    pluginName: "mock-plugin",
    isEnabled: false
  }]);
});
