import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import insertPrimaryShop from "@reactioncommerce/api-utils/tests/insertPrimaryShop.js";
import Factory from "/tests/util/factory.js";
import { ReactionAPICore } from "@reactioncommerce/api-core";

const VerifySMTPEmailSettingsMutation = importAsString("./verifySMTPEmailSettings.graphql");

jest.mock("@reactioncommerce/nodemailer", () =>
  ({
    __esModule: true,
    default: {
      createTransport: jest.fn().mockImplementation(() => ({
        verify: jest.fn().mockImplementation(() => true)
      }))
    }
  }));

jest.setTimeout(300000);

let verifySMTPEmailSettings;
let mockAdminAccount;
let shopId;
let testApp;

beforeAll(async () => {
  testApp = new ReactionAPICore();
  await testApp.start();
  shopId = await insertPrimaryShop(testApp.context);

  const adminGroup = Factory.Group.makeOne({
    _id: "adminGroup",
    createdBy: null,
    name: "admin",
    permissions: ["reaction:legacy:emails/read"],
    slug: "admin",
    shopId
  });
  await testApp.collections.Groups.insertOne(adminGroup);

  mockAdminAccount = Factory.Account.makeOne({
    _id: "mockAdminAccount",
    groups: [adminGroup._id],
    shopId
  });
  await testApp.createUserAndAccount(mockAdminAccount);

  verifySMTPEmailSettings = testApp.mutate(VerifySMTPEmailSettingsMutation);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

test("test if email config data is verified by nodemailer", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await verifySMTPEmailSettings({
    input: {
      shopId
    }
  });

  expect(result.verifySMTPEmailSettings.isVerified).toBe(true);
});
