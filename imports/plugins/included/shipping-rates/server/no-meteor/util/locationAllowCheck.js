/**
 * @summary Filter shipping methods based on per method allow location restrictions
 * @param {Object} methodRestrictions - method restrictions from FlatRateFulfillmentRestrcitionsCollection
 * @param {Object} method - current method to check restrcictions against
 * @param {Object} hydratedCart - hydrated cart for current order
 * @returns {Bool} true / false as to whether method is still valid after this check
 */
export async function locationAllowCheck(methodRestrictions, method, hydratedCart) {
  // Get method specific allow restrictions
  const allowRestrictions = methodRestrictions.filter((methodRestriction) => methodRestriction.type === "allow");

  // Check to see if any restrictions for this method are destination restrictions
  const destinationRestrictions = allowRestrictions.some((restriction) => restriction.destination !== null);

  // If there are no destination allow restrictions, this method is valid at this point
  if (!destinationRestrictions) {
    return true;
  }

  // Loop over each allow restriction and determine if this method is valid
  // If any levels of destination match, this method is valid at this point
  const isAllowed = allowRestrictions.some((methodRestriction) => {
    const { destination } = methodRestriction;

    // If there is no destination restriction on this method, it is valid at this point
    if (!destination) {
      return true;
    }

    // Start checking at the micro-level, and move more macro as we go on
    // Check for an allow list of postal codes
    if (destination.postal && destination.postal.includes(hydratedCart.address.postal)) {
      return true;
    }

    // Check for an allow list of regions
    if (destination.region && destination.region.includes(hydratedCart.address.region)) {
      return true;
    }

    // Check for an allow list of countries
    if (destination.country && destination.country.includes(hydratedCart.address.country)) {
      return true;
    }

    return false;
  });

  return isAllowed;
}
