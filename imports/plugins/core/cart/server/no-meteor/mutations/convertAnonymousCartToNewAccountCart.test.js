import mockContext from "/imports/test-utils/helpers/mockContext";
import convertAnonymousCartToNewAccountCart from "./convertAnonymousCartToNewAccountCart";

const { Cart } = mockContext.collections;
const mockCart = { _id: "mockCart" };
const currencyCode = "GBP";
const accountId = "accountId";
const anonymousCartSelector = { _id: "123" };
const shopId = "shopId";
const items = [
  {
    _id: "CartItemID",
    addedAt: new Date("2018-01-01T00:00:00.000"),
    createdAt: new Date("2018-01-01T00:00:00.000"),
    productId: "productId",
    quantity: 1,
    shopId: "shopId",
    title: "TITLE",
    updatedAt: new Date("2018-01-01T00:00:00.000"),
    variantId: "variantId",
    isTaxable: false,
    priceWhenAdded: {
      amount: 9.99,
      currencyCode: "USD"
    }
  }
];

test("inserts a cart with the existing cart's items and returns it", async () => {
  Cart.insertOne.mockReturnValueOnce(Promise.resolve({ ops: [mockCart], result: { ok: 1 } }));

  const result = await convertAnonymousCartToNewAccountCart({
    accountId,
    anonymousCart: {
      currencyCode,
      items
    },
    anonymousCartSelector,
    Cart,
    shopId
  });

  expect(Cart.insertOne).toHaveBeenCalledWith({
    _id: jasmine.any(String),
    accountId,
    anonymousAccessToken: null,
    // We will set this billing currency stuff right away because historical Meteor code did it.
    // If this turns out to not be necessary, we should remove it.
    billing: [
      {
        _id: jasmine.any(String),
        currency: { userCurrency: currencyCode }
      }
    ],
    currencyCode,
    createdAt: jasmine.any(Date),
    items,
    shopId,
    updatedAt: jasmine.any(Date),
    workflow: {
      status: "new"
    }
  });

  expect(Cart.deleteOne).toHaveBeenCalledWith(anonymousCartSelector);

  expect(result).toEqual(mockCart);
});

test("throws if insertOne fails", async () => {
  Cart.insertOne.mockReturnValueOnce(Promise.resolve({ ops: [mockCart], result: { ok: 0 } }));

  const promise = convertAnonymousCartToNewAccountCart({
    accountId,
    anonymousCart: {
      currencyCode,
      items
    },
    anonymousCartSelector,
    Cart,
    shopId
  });

  return expect(promise).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if deleteOne fails", async () => {
  Cart.insertOne.mockReturnValueOnce(Promise.resolve({ ops: [mockCart], result: { ok: 1 } }));
  Cart.deleteOne.mockReturnValueOnce(Promise.resolve({ deletedCount: 0 }));

  const promise = convertAnonymousCartToNewAccountCart({
    accountId,
    anonymousCart: {
      currencyCode,
      items
    },
    anonymousCartSelector,
    Cart,
    shopId
  });

  return expect(promise).rejects.toThrowErrorMatchingSnapshot();
});
