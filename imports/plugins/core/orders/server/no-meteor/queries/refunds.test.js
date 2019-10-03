/* eslint camelcase: 0 */
import refunds from "./refunds";
import mockContext from "@reactioncommerce/api-utils/tests/mockContext.js";
import { rewire$getPaymentMethodConfigByName } from "/imports/node-app/core-services/payments/registration.js"; // TODO: remove cross-plugin import (https://github.com/reactioncommerce/reaction/issues/5653)

beforeAll(() => {
  rewire$getPaymentMethodConfigByName(() => ({
    functions: {
      listRefunds: async () => [{
        _id: "refundId",
        type: "refund",
        amount: 19.99,
        currency: "usd"
      }]
    }
  }));
});

beforeEach(() => {
  jest.resetAllMocks();
});

const order = {
  _id: "order1",
  payments: [
    {
      _id: "payment1"
    }, {
      _id: "payment2"
    }
  ],
  shopId: "SHOP_ID"
};

test("throws if orderId isn't supplied", async () => {
  mockContext.userHasPermission.mockReturnValueOnce(true);
  await expect(refunds(mockContext, { orderId: null, shopId: order.shopId, token: null })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if shopId isn't supplied", async () => {
  mockContext.userHasPermission.mockReturnValueOnce(true);
  await expect(refunds(mockContext, { orderId: order._id, shopId: null, token: null })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if the order doesn't exist", async () => {
  mockContext.userHasPermission.mockReturnValueOnce(true);
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(null));

  await expect(refunds(mockContext, {
    orderId: "order1",
    shopId: order.shopId
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("should call refunds with the proper parameters and return a list of refunds for an order", async () => {
  mockContext.userHasPermission.mockReturnValueOnce(true);
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(order));

  const result = await refunds(mockContext, {
    orderId: order._id,
    shopId: order.shopId
  });

  expect(result[0].type).toBe("refund");
  expect(result[0].amount).toBe(19.99);
  expect(result[0].currency).toBe("usd");
});
