import registerAccountsPlugin from "/imports/plugins/core/accounts/server/no-meteor/register";
import registerAddressPlugin from "/imports/plugins/core/address/server/no-meteor/register";
import registerCartPlugin from "/imports/plugins/core/cart/server/no-meteor/register";
import registerCatalogPlugin from "/imports/plugins/core/catalog/server/no-meteor/register";
import registerCorePlugin from "/imports/plugins/core/core/server/no-meteor/register";
import registerDiscountsPlugin from "/imports/plugins/core/discounts/server/no-meteor/register";
import registerFilesPlugin from "/imports/plugins/core/files/server/no-meteor/register";
import registerI18nPlugin from "/imports/plugins/core/i18n/server/no-meteor/register";
import registerInventoryPlugin from "/imports/plugins/core/inventory/server/no-meteor/register";
import registerNavigationPlugin from "/imports/plugins/core/navigation/server/no-meteor/register";
import registerOrdersPlugin from "/imports/plugins/core/orders/server/no-meteor/register";
import registerPaymentsPlugin from "/imports/plugins/core/payments/server/no-meteor/register";
import registerProductPlugin from "/imports/plugins/core/product/server/no-meteor/register";
import registerSettingsPlugin from "/imports/plugins/core/settings/server/register";
import registerShippingPlugin from "/imports/plugins/core/shipping/server/no-meteor/register";
import registerSystemInfoPlugin from "/imports/plugins/core/system-info/server/no-meteor/register";
import registerTagsPlugin from "/imports/plugins/core/tags/server/no-meteor/register";
import registerTaxesPlugin from "/imports/plugins/core/taxes/server/no-meteor/register";
import registerTemplatesPlugin from "/imports/plugins/core/templates/server/no-meteor/register";
import registerDiscountCodesPlugin from "/imports/plugins/included/discount-codes/server/no-meteor/register";
import registerSMTPEmailPlugin from "/imports/plugins/included/email-smtp/server/no-meteor/register";
import registerEmailTemplatesPlugin from "/imports/plugins/included/email-templates/server/register";
import registerMarketplacePlugin from "/imports/plugins/included/marketplace/server/no-meteor/register";
import registerNotificationsPlugin from "/imports/plugins/included/notifications/server/no-meteor/register";
import registerExamplePaymentsPlugin from "/imports/plugins/included/payments-example/server/no-meteor/register";
import registerStripePaymentsPlugin from "/imports/plugins/included/payments-stripe/server/no-meteor/register";
import registerShippingRatesPlugin from "/imports/plugins/included/shipping-rates/server/no-meteor/register";
import registerSimpleInventoryPlugin from "/imports/plugins/included/simple-inventory/server/no-meteor/register";
import registerSimplePricingPlugin from "/imports/plugins/included/simple-pricing/server/no-meteor/register";
import registerSurchargesPlugin from "/imports/plugins/included/surcharges/server/no-meteor/register";
import registerTaxesRatesPlugin from "/imports/plugins/included/taxes-rates/server/no-meteor/register";
import registerTestAddressValidationPlugin from "/imports/plugins/included/address-validation-test/server/register";

/**
 * @summary A function in which you should call `register` function for each API plugin,
 *   in the order in which you want to register them.
 * @param {ReactionNodeApp} app The ReactionNodeApp instance
 * @return {Promise<null>} Null
 */
export default async function registerPlugins(app) {
  // Core
  await registerFilesPlugin(app); // Core plugin needs Media collection, so files plugin must be first
  await registerCorePlugin(app);
  await registerAccountsPlugin(app);
  await registerAddressPlugin(app);
  await registerCartPlugin(app);
  await registerCatalogPlugin(app);
  await registerDiscountsPlugin(app);
  await registerI18nPlugin(app);
  await registerInventoryPlugin(app);
  await registerNavigationPlugin(app);
  await registerOrdersPlugin(app);
  await registerPaymentsPlugin(app);
  await registerProductPlugin(app);
  await registerSettingsPlugin(app);
  await registerShippingPlugin(app);
  await registerSystemInfoPlugin(app);
  await registerTagsPlugin(app);
  await registerTaxesPlugin(app);
  await registerTemplatesPlugin(app);

  // Included
  await registerSMTPEmailPlugin(app);
  await registerEmailTemplatesPlugin(app);
  await registerDiscountCodesPlugin(app);
  await registerMarketplacePlugin(app);
  await registerNotificationsPlugin(app);
  await registerExamplePaymentsPlugin(app);
  await registerStripePaymentsPlugin(app);
  await registerShippingRatesPlugin(app);
  await registerSimpleInventoryPlugin(app);
  await registerSimplePricingPlugin(app);
  await registerSurchargesPlugin(app);
  await registerTaxesRatesPlugin(app);

  if (process.env.NODE_ENV === "development") {
    await registerTestAddressValidationPlugin(app);
  }
}
