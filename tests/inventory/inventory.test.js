import TestApp from "../TestApp";
import Factory from "/imports/test-utils/helpers/factory";
import updateSimpleInventoryBulk from "../../imports/plugins/included/simple-inventory/server/no-meteor/mutations/updateSimpleInventoryBulk";
import catalogItemQuery from "./catalogItemQuery.graphql";
import simpleInventoryQuery from "./simpleInventoryQuery.graphql";
import updateSimpleInventoryMutation from "./updateSimpleInventoryMutation.graphql";

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const internalProductId = "product1";
const opaqueProductId = "cmVhY3Rpb24vcHJvZHVjdDpwcm9kdWN0MQ==";
const internalVariantId = "variant1";
const internalOptionId1 = "option1";
const opaqueOptionId1 = "cmVhY3Rpb24vcHJvZHVjdDpvcHRpb24x";
const internalOptionId2 = "option2";
const opaqueOptionId2 = "cmVhY3Rpb24vcHJvZHVjdDpvcHRpb24y";
const shopName = "Test Shop";

const product = Factory.Product.makeOne({
  _id: internalProductId,
  ancestors: [],
  handle: "test-product",
  isDeleted: false,
  isVisible: true,
  shopId: internalShopId,
  type: "simple"
});

const variant = Factory.Product.makeOne({
  _id: internalVariantId,
  ancestors: [internalProductId],
  isDeleted: false,
  isVisible: true,
  shopId: internalShopId,
  type: "variant"
});

const option1 = Factory.Product.makeOne({
  _id: internalOptionId1,
  ancestors: [internalProductId, internalVariantId],
  isDeleted: false,
  isVisible: true,
  shopId: internalShopId,
  type: "variant"
});

const option2 = Factory.Product.makeOne({
  _id: internalOptionId2,
  ancestors: [internalProductId, internalVariantId],
  isDeleted: false,
  isVisible: true,
  shopId: internalShopId,
  type: "variant"
});

const mockCustomerAccount = Factory.Accounts.makeOne({
  roles: {
    [internalShopId]: []
  },
  shopId: internalShopId
});

const mockAdminAccount = Factory.Accounts.makeOne({
  roles: {
    [internalShopId]: ["admin"]
  },
  shopId: internalShopId
});

let testApp;
let getCatalogItem;
let simpleInventory;
let updateSimpleInventory;
beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await testApp.collections.Products.insertOne(product);
  await testApp.collections.Products.insertOne(variant);
  await testApp.collections.Products.insertOne(option1);
  await testApp.collections.Products.insertOne(option2);

  await testApp.publishProducts([internalProductId]);

  await testApp.createUserAndAccount(mockCustomerAccount);
  await testApp.createUserAndAccount(mockAdminAccount);

  getCatalogItem = testApp.query(catalogItemQuery);
  simpleInventory = testApp.query(simpleInventoryQuery);
  updateSimpleInventory = testApp.mutate(updateSimpleInventoryMutation);
});

afterAll(async () => {
  await testApp.collections.Products.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  testApp.stop();
});

test("throws access-denied when getting simpleInventory if not an admin", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await simpleInventory({
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }
});

test("throws access-denied when updating simpleInventory if not an admin", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await updateSimpleInventory({
      input: {
        productConfiguration: {
          productId: opaqueProductId,
          productVariantId: opaqueOptionId1
        },
        shopId: opaqueShopId,
        isEnabled: true
      }
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }
});

test("returns null if no SimpleInventory record", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: null
  });
});

test("returns SimpleInventory record", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const mutationResult = await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true
    }
  });
  expect(mutationResult).toEqual({
    updateSimpleInventory: {
      inventoryInfo: {
        canBackorder: false,
        inventoryInStock: 0,
        inventoryReserved: 0,
        isEnabled: true,
        lowInventoryWarningThreshold: 0
      }
    }
  });

  const mutationResult2 = await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      canBackorder: true,
      inventoryInStock: 20,
      lowInventoryWarningThreshold: 2
    }
  });
  expect(mutationResult2).toEqual({
    updateSimpleInventory: {
      inventoryInfo: {
        canBackorder: true,
        inventoryInStock: 20,
        inventoryReserved: 0,
        isEnabled: true,
        lowInventoryWarningThreshold: 2
      }
    }
  });

  const queryResult = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(queryResult).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 20,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });
});

test("when all options are sold out and canBackorder, isBackorder is true in Catalog", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 0
    }
  });

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId2
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 0
    }
  });

  const queryResult = await getCatalogItem({
    slugOrId: product.handle
  });
  expect(queryResult).toEqual({
    catalogItemProduct: {
      product: {
        isBackorder: true,
        isLowQuantity: true,
        isSoldOut: true,
        variants: [{
          canBackorder: true,
          inventoryAvailableToSell: 0,
          inventoryInStock: 0,
          isBackorder: true,
          isLowQuantity: true,
          isSoldOut: true,
          options: [
            {
              canBackorder: true,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: true,
              isLowQuantity: true,
              isSoldOut: true
            },
            {
              canBackorder: true,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: true,
              isLowQuantity: true,
              isSoldOut: true
            }
          ]
        }]
      }
    }
  });
});

test("Bulk version test: when all options are sold out and canBackorder, isBackorder is true in Catalog", async () => {
  await updateSimpleInventoryBulk(testApp.context, {
    updates: [
      {
        productConfiguration: {
          productId: internalProductId,
          productVariantId: internalOptionId1
        },
        shopId: internalShopId,
        isEnabled: true,
        canBackorder: true,
        inventoryInStock: 0
      },
      {
        productConfiguration: {
          productId: internalProductId,
          productVariantId: internalOptionId2
        },
        shopId: internalShopId,
        isEnabled: true,
        canBackorder: true,
        inventoryInStock: 0
      }
    ]
  });

  const queryResult = await getCatalogItem({
    slugOrId: product.handle
  });
  expect(queryResult).toEqual({
    catalogItemProduct: {
      product: {
        isBackorder: true,
        isLowQuantity: true,
        isSoldOut: true,
        variants: [{
          canBackorder: true,
          inventoryAvailableToSell: 0,
          inventoryInStock: 0,
          isBackorder: true,
          isLowQuantity: true,
          isSoldOut: true,
          options: [
            {
              canBackorder: true,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: true,
              isLowQuantity: true,
              isSoldOut: true
            },
            {
              canBackorder: true,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: true,
              isLowQuantity: true,
              isSoldOut: true
            }
          ]
        }]
      }
    }
  });
});

test("when all options are sold out and canBackorder is false, isBackorder is false in Catalog", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: false,
      inventoryInStock: 0
    }
  });

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId2
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: false,
      inventoryInStock: 0
    }
  });

  const queryResult = await getCatalogItem({
    slugOrId: product.handle
  });
  expect(queryResult).toEqual({
    catalogItemProduct: {
      product: {
        isBackorder: false,
        isLowQuantity: true,
        isSoldOut: true,
        variants: [{
          canBackorder: false,
          inventoryAvailableToSell: 0,
          inventoryInStock: 0,
          isBackorder: false,
          isLowQuantity: true,
          isSoldOut: true,
          options: [
            {
              canBackorder: false,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: false,
              isLowQuantity: true,
              isSoldOut: true
            },
            {
              canBackorder: false,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: false,
              isLowQuantity: true,
              isSoldOut: true
            }
          ]
        }]
      }
    }
  });
});

test("when one option is backordered, isBackorder is true for product in Catalog", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: false,
      inventoryInStock: 10
    }
  });

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId2
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 0
    }
  });

  const queryResult = await getCatalogItem({
    slugOrId: product.handle
  });
  expect(queryResult).toEqual({
    catalogItemProduct: {
      product: {
        isBackorder: false,
        isLowQuantity: true,
        isSoldOut: false,
        variants: [{
          canBackorder: true,
          inventoryAvailableToSell: 10,
          inventoryInStock: 10,
          isBackorder: false,
          isLowQuantity: true,
          isSoldOut: false,
          options: [
            {
              canBackorder: false,
              inventoryAvailableToSell: 10,
              inventoryInStock: 10,
              isBackorder: false,
              isLowQuantity: false,
              isSoldOut: false
            },
            {
              canBackorder: true,
              inventoryAvailableToSell: 0,
              inventoryInStock: 0,
              isBackorder: true,
              isLowQuantity: true,
              isSoldOut: true
            }
          ]
        }]
      }
    }
  });
});

test("all options available", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 10
    }
  });

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId2
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 20
    }
  });

  const queryResult = await getCatalogItem({
    slugOrId: product.handle
  });
  expect(queryResult).toEqual({
    catalogItemProduct: {
      product: {
        isBackorder: false,
        isLowQuantity: false,
        isSoldOut: false,
        variants: [{
          canBackorder: true,
          inventoryAvailableToSell: 30,
          inventoryInStock: 30,
          isBackorder: false,
          isLowQuantity: false,
          isSoldOut: false,
          options: [
            {
              canBackorder: true,
              inventoryAvailableToSell: 10,
              inventoryInStock: 10,
              isBackorder: false,
              isLowQuantity: false,
              isSoldOut: false
            },
            {
              canBackorder: true,
              inventoryAvailableToSell: 20,
              inventoryInStock: 20,
              isBackorder: false,
              isLowQuantity: false,
              isSoldOut: false
            }
          ]
        }]
      }
    }
  });
});

test("simple-inventory updates during standard order flow", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 10
    }
  });

  const order = {
    payments: [],
    shipping: [
      {
        items: [
          {
            productId: internalProductId,
            quantity: 2,
            variantId: internalOptionId1
          }
        ]
      }
    ],
    workflow: {
      status: "new",
      workflow: ["new"]
    }
  };

  await testApp.context.appEvents.emit("afterOrderCreate", { order });

  let result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 10,
      inventoryReserved: 2,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });

  await testApp.context.appEvents.emit("afterOrderApprovePayment", { order });

  result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 8,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });
});

test("simple-inventory updates when canceling before approve", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 10
    }
  });

  const order = {
    payments: [
      {
        status: "created"
      }
    ],
    shipping: [
      {
        items: [
          {
            productId: internalProductId,
            quantity: 2,
            variantId: internalOptionId1
          }
        ]
      }
    ],
    workflow: {
      status: "new",
      workflow: ["new"]
    }
  };

  await testApp.context.appEvents.emit("afterOrderCreate", { order });

  let result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 10,
      inventoryReserved: 2,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });

  await testApp.context.appEvents.emit("afterOrderCancel", { order });

  result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 10,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });
});

test("simple-inventory updates when canceling after approve, do not return to stock", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 10
    }
  });

  const order = {
    payments: [
      {
        status: "created"
      }
    ],
    shipping: [
      {
        items: [
          {
            productId: internalProductId,
            quantity: 2,
            variantId: internalOptionId1
          }
        ]
      }
    ],
    workflow: {
      status: "new",
      workflow: ["new"]
    }
  };

  await testApp.context.appEvents.emit("afterOrderCreate", { order });

  let result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 10,
      inventoryReserved: 2,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });

  order.payments[0].status = "approved";
  await testApp.context.appEvents.emit("afterOrderApprovePayment", { order });

  result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 8,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });

  await testApp.context.appEvents.emit("afterOrderCancel", { order, returnToStock: false });

  result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 8,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });
});

test("simple-inventory updates when canceling after approve, do return to stock", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  await updateSimpleInventory({
    input: {
      productConfiguration: {
        productId: opaqueProductId,
        productVariantId: opaqueOptionId1
      },
      shopId: opaqueShopId,
      isEnabled: true,
      canBackorder: true,
      inventoryInStock: 10
    }
  });

  const order = {
    payments: [
      {
        status: "created"
      }
    ],
    shipping: [
      {
        items: [
          {
            productId: internalProductId,
            quantity: 2,
            variantId: internalOptionId1
          }
        ]
      }
    ],
    workflow: {
      status: "new",
      workflow: ["new"]
    }
  };

  await testApp.context.appEvents.emit("afterOrderCreate", { order });

  let result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 10,
      inventoryReserved: 2,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });

  order.payments[0].status = "approved";
  await testApp.context.appEvents.emit("afterOrderApprovePayment", { order });

  result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 8,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });

  await testApp.context.appEvents.emit("afterOrderCancel", { order, returnToStock: true });

  result = await simpleInventory({
    productConfiguration: {
      productId: opaqueProductId,
      productVariantId: opaqueOptionId1
    },
    shopId: opaqueShopId
  });
  expect(result).toEqual({
    simpleInventory: {
      canBackorder: true,
      inventoryInStock: 10,
      inventoryReserved: 0,
      isEnabled: true,
      lowInventoryWarningThreshold: 2
    }
  });
});
