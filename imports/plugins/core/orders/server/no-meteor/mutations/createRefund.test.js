/* eslint camelcase: 0 */
import nock from "nock";
import Factory from "/imports/test-utils/helpers/factory";
import mockContext from "/imports/test-utils/helpers/mockContext";
import exampleCreateRefund from "imports/plugins/included/payments-example/server/no-meteor/util/exampleCreateRefund.js";
import createRefund from "./createRefund";

beforeEach(() => {
  jest.resetAllMocks();
});

const fakeOrder = {
  _id: "order1",
  payments: [
    {
      _id: "payment1"
    },
    {
      _id: "payment2"
    }
  ],
  shipping: [
    Factory.OrderFulfillmentGroup.makeOne({
      items: [
        Factory.OrderItem.makeOne({
          _id: "abc",
          quantity: 1,
          price: {
            amount: 1,
            currencyCode: "USD"
          },
          subtotal: 1,
          workflow: {
            status: "new",
            workflow: ["new"]
          }
        })
      ],
      workflow: {
        status: "new",
        workflow: ["new"]
      }
    })
  ],
  shopId: "SHOP_ID",
  workflow: {
    status: "new",
    workflow: ["new"]
  }
};

test("throws if permission check fails", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(fakeOrder));

  mockContext.userHasPermission.mockReturnValueOnce(false);

  await expect(createRefund(mockContext, {
    amount: 10,
    orderId: "order1",
    paymentId: "payment1",
    reason: "Customer was unsatisfied with purchase"
  })).rejects.toThrowErrorMatchingSnapshot();

  expect(mockContext.userHasPermission).toHaveBeenCalledWith(["orders", "order/fulfillment"], "SHOP_ID");
});

test("skips permission check if context.isInternalCall", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(fakeOrder));

  mockContext.isInternalCall = true;

  await expect(createRefund(mockContext, {
    amount: 10,
    orderId: "order1",
    paymentId: "payment1",
    reason: "Customer was unsatisfied with purchase"
  }));

  delete mockContext.isInternalCall;

  expect(mockContext.userHasPermission).not.toHaveBeenCalled();
});

test("throws if amount isn't supplied", async () => {
  await expect(createRefund(mockContext, {
    amount: null,
    orderId: fakeOrder._id,
    paymentId: fakeOrder.payments[0]._id,
    reason: "Customer was unsatisfied with purchase"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if orderId isn't supplied", async () => {
  await expect(createRefund(mockContext, {
    amount: 10,
    orderId: null,
    paymentId: fakeOrder.payments[0]._id,
    reason: "Customer was unsatisfied with purchase"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if paymentId isn't supplied", async () => {
  await expect(createRefund(mockContext, {
    amount: 10,
    orderId: fakeOrder._id,
    paymentId: null,
    reason: "Customer was unsatisfied with purchase"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if payment doesn't exist", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(fakeOrder));

  mockContext.userHasPermission.mockReturnValueOnce(true);

  await expect(createRefund(mockContext, {
    amount: 10,
    orderId: fakeOrder._id,
    paymentId: "payment3",
    reason: "Customer was unsatisfied with purchase"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if amount is less than $0.01", async () => {
  mockContext.collections.Orders.findOne.mockReturnValueOnce(Promise.resolve(fakeOrder));

  mockContext.userHasPermission.mockReturnValueOnce(true);

  await expect(createRefund(mockContext, {
    amount: 0,
    orderId: fakeOrder._id,
    paymentId: "payment3",
    reason: "Customer was unsatisfied with purchase"
  })).rejects.toThrowErrorMatchingSnapshot();
});

test("should call example payment method createRefund with the proper parameters and return saved = true", async () => {
  const paymentMethod = {
    processor: "Example",
    displayName: "IOU from EK",
    paymentPluginName: "example-paymentmethod",
    method: "credit",
    transactionId: "ch_17hZ4wBXXkbZQs3xL5JhlSgS",
    amount: 19.99,
    status: "completed",
    mode: "captured",
    createdAt: new Date(),
    workflow: { status: "new" },
    metadata: {},
    currencyCode: "USD"
  };

  const refundResult = {
    id: "re_17hZzSBXXkbZQs3xgmmEeOci",
    object: "refund",
    amount: 1999,
    balance_transaction: "txn_17hZzSBXXkbZQs3xr6d9YECZ",
    charge: "ch_17hZ4wBXXkbZQs3xL5JhlSgS",
    created: 1456210186,
    currency: "usd",
    metadata: {},
    reason: null,
    receipt_number: null
  };

  const result = await exampleCreateRefund(mockContext, paymentMethod, paymentMethod.amount, "Reason for refund");

  mockContext.collections.ExampleIOUPaymentRefunds.insertOne.mockReturnValueOnce(Promise.resolve(refundResult));

  expect(result.saved).toBe(true);
});
