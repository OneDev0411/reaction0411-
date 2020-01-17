/**
 * @summary Optionally mutates a new variant before it is inserted into the Products collection
 * @param {Object} newVariant The new variant that is being built. Should mutate this.
 * @param {Object} input Input data
 * @returns {undefined}
 */
export default async function mutateNewVariantBeforeCreateForTaxes(newVariant, { context, isOption }) {
  // Tax fields are managed by and inherited from top-level variant
  if (!isOption) {
    // All new variants are taxable by default
    newVariant.isTaxable = true;

    // Give new variants the default tax code, if one is set
    const { defaultTaxCode } = await context.queries.appSettings(context, newVariant.shopId);
    if (!defaultTaxCode) return;

    newVariant.taxCode = defaultTaxCode;
  }
}
