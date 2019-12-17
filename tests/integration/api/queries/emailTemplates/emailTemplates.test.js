import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const emailTemplatesQuery = importAsString("./emailTemplatesQuery.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const shopName = "Test Shop";
const emailTemplateDocuments = [];
const template = `
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>This is a test email</title>
</head>
<body style="margin:0; padding:0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" class="emailwrapto100pc">
    <tr>
      <td align="center" valign="middle">
        <p>This is a test email template</p>
      </td>
    </tr>
  </table>
</body>
`;
const emailTemplateData = [{
  name: "orders/new",
  subject: "Your order is confirmed - {{order.referenceId}}",
  template,
  title: "Orders - New Order Placed",
  type: "email"
}, {
  name: "accounts/resetPassword",
  subject: "{{shop.name}}: Here's your password reset link",
  template,
  title: "Accounts - Reset Password",
  type: "email"
}, {
  name: "accounts/verifyEmail",
  subject: "{{shopName}}: Please verify your email address",
  template,
  title: "Accounts - Verify Account",
  type: "email"
}];

// Create 10 test email template documents
for (let index = 0; index < 3; index += 1) {
  const doc = Factory.EmailTemplates.makeOne({
    _id: `emailTemplate-${index}`,
    shopId: internalShopId,
    enabled: true,
    language: "en",
    name: emailTemplateData[index].name,
    parser: "handlebars",
    provides: "template",
    subject: emailTemplateData[index].subject,
    template: emailTemplateData[index].template,
    title: emailTemplateData[index].title,
    type: "email"
  });

  emailTemplateDocuments.push(doc);
}


const mockAdminAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: ["admin"]
  },
  shopId: internalShopId
});

const mockCustomerAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: []
  },
  shopId: internalShopId
});

let testApp;
let emailTemplates;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });

  await Promise.all(emailTemplateDocuments.map((doc) => (
    testApp.collections.Templates.insertOne(doc)
  )));

  await testApp.createUserAndAccount(mockAdminAccount);
  await testApp.createUserAndAccount(mockCustomerAccount);

  emailTemplates = testApp.query(emailTemplatesQuery);
});

afterAll(async () => {
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.users.deleteMany({});
  await testApp.collections.Templates.deleteMany({});
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  await testApp.stop();
});

test("throws access-denied when retrieving email templates if not an admin", async () => {
  await testApp.setLoggedInUser(mockCustomerAccount);

  try {
    await emailTemplates({
      shopId: opaqueShopId
    });
  } catch (errors) {
    expect(errors[0]).toMatchSnapshot();
  }
});

test("returns email template records if user is an admin", async () => {
  await testApp.setLoggedInUser(mockAdminAccount);

  const result = await emailTemplates({
    shopId: opaqueShopId,
    first: 3,
    offset: 0
  });

  expect(result.emailTemplates.nodes.length).toEqual(3);
  expect(result.emailTemplates.nodes[0].name).toEqual("orders/new");
  expect(result.emailTemplates.nodes[2].name).toEqual("accounts/verifyEmail");
  expect(result.emailTemplates.nodes[2].template).toEqual(template);
});
