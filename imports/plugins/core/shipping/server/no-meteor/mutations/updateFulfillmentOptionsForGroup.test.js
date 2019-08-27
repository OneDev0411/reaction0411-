import Factory from "/imports/test-utils/helpers/factory";
import mockContext from "/imports/test-utils/helpers/mockContext";
import updateFulfillmentOptionsForGroup from "./updateFulfillmentOptionsForGroup";

jest.mock("../util/getCartById", () => jest.fn().mockImplementation(() => Promise.resolve({
  _id: "cartId",
  items: [{
    _id: "123",
    price: {
      amount: 19.99
    },
    priceWhenAdded: {
      amount: 19.99
    },
    subtotal: {
      amount: 19.99
    }
  }],
  shipping: [{
    _id: "group1",
    itemIds: ["123"],
    type: "shipping"
  }]
})));

const fakeCart = Factory.Cart.makeOne();
const fakeQuote = Factory.ShipmentQuote.makeOne();
const mockGetFulfillmentMethodsWithQuotes = jest.fn().mockName("getFulfillmentMethodsWithQuotes");

beforeAll(() => {
  mockContext.queries = {
    getFulfillmentMethodsWithQuotes: mockGetFulfillmentMethodsWithQuotes
  };
  if (!mockContext.mutations.saveCart) {
    mockContext.mutations.saveCart = jest.fn().mockName("context.mutations.saveCart").mockImplementation(async (_, cart) => cart);
  }
});

beforeEach(() => {
  mockGetFulfillmentMethodsWithQuotes.mockClear();
});

test("updates cart properly for empty rates", async () => {
  mockGetFulfillmentMethodsWithQuotes.mockReturnValueOnce(Promise.resolve([]));
  mockContext.collections.Cart.findOne.mockReturnValueOnce(Promise.resolve(fakeCart));

  const result = await updateFulfillmentOptionsForGroup(mockContext, {
    cartId: "cartId",
    fulfillmentGroupId: "group1"
  });

  expect(result).toEqual({
    cart: {
      _id: "cartId",
      items: [{
        _id: "123",
        price: {
          amount: 19.99
        },
        priceWhenAdded: {
          amount: 19.99
        },
        subtotal: {
          amount: 19.99
        }
      }],
      shipping: [{
        _id: "group1",
        itemIds: ["123"],
        type: "shipping",
        shipmentQuotes: [],
        shipmentQuotesQueryStatus: { requestStatus: "pending" }
      }],
      updatedAt: jasmine.any(Date)
    }
  });
});

test("updates cart properly for error rates", async () => {
  mockGetFulfillmentMethodsWithQuotes.mockReturnValueOnce(Promise.resolve([{
    requestStatus: "error",
    shippingProvider: "all",
    message: "All requests for shipping methods failed."
  }]));

  const result = await updateFulfillmentOptionsForGroup(mockContext, {
    cartId: "cartId",
    fulfillmentGroupId: "group1"
  });

  expect(result).toEqual({
    cart: {
      _id: "cartId",
      items: [{
        _id: "123",
        price: {
          amount: 19.99
        },
        priceWhenAdded: {
          amount: 19.99
        },
        subtotal: {
          amount: 19.99
        }
      }],
      shipping: [{
        _id: "group1",
        itemIds: ["123"],
        type: "shipping",
        shipmentQuotes: [],
        shipmentQuotesQueryStatus: {
          requestStatus: "error",
          shippingProvider: "all",
          message: "All requests for shipping methods failed."
        }
      }],
      updatedAt: jasmine.any(Date)
    }
  });
});

test("updates cart properly for success rates", async () => {
  mockGetFulfillmentMethodsWithQuotes.mockReturnValueOnce(Promise.resolve([fakeQuote]));
  mockContext.collections.Cart.findOne.mockReturnValueOnce(Promise.resolve(fakeCart));

  const result = await updateFulfillmentOptionsForGroup(mockContext, {
    cartId: "cartId",
    fulfillmentGroupId: "group1"
  });

  expect(result).toEqual({
    cart: {
      _id: "cartId",
      items: [{
        _id: "123",
        price: {
          amount: 19.99
        },
        priceWhenAdded: {
          amount: 19.99
        },
        subtotal: {
          amount: 19.99
        }
      }],
      shipping: [{
        _id: "group1",
        itemIds: ["123"],
        type: "shipping",
        shipmentQuotes: [fakeQuote],
        shipmentQuotesQueryStatus: {
          requestStatus: "success",
          numOfShippingMethodsFound: 1
        }
      }],
      updatedAt: jasmine.any(Date)
    }
  });
});

test("throws if there is no fulfillment group with the given ID", async () => {
  await expect(updateFulfillmentOptionsForGroup(mockContext, {
    cartId: "cartId",
    fulfillmentGroupId: "group2"
  })).rejects.toThrowErrorMatchingSnapshot();
});
