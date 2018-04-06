/**
 * Arguments passed by the client a groups query
 * @typedef {Object} AddressInput - Address
 * @property {String} address1 - Address line 1
 * @property {String} [address2] - Address line 2
 * @property {String} city - City
 * @property {String} [company] - Company name
 * @property {String} country - Country
 * @property {Boolean} [failedValidation] - Mark address as failed validation by address validation service
 * @property {String} fullName - Full name
 * @property {Boolean} isBillingDefault - Mark address as default for billing
 * @property {Boolean} isCommercial - Mask address as commercial
 * @property {Boolean} isShippingDefault -  Mark address as default for shipping
 * @property {Array<MetafieldInput>} metafields - Array of metafields
 * @property {String} phone - Phone number
 * @property {String} postal - Postal code
 * @property {String} region - Region of country
 */

export const typeDefs = `
  # A list of the possible types of \`Address\`
  enum AddressType {
    # Address can be used for payment transactions and invoicing
    billing

    # Address can be used as a mailing address for sending physical items
    shipping
  }

  # The details of an \`Address\` to be created or updated
  input AddressInput {
    # The street address / first line
    address1: String!

    # Optional second line
    address2: String

    # City
    city: String!

    # Optional company name, if it's a business address
    company: String

    # Country
    country: String!

    # The full name of a person at this address
    fullName: String!

    # Is this the default address for billing purposes?
    isBillingDefault: Boolean!

    # Is this a commercial address?
    isCommercial: Boolean!

    # Is this the default address to use when selecting a shipping address at checkout?
    isShippingDefault: Boolean!

    # Arbitrary additional metadata about this address
    metafields: [MetafieldInput]

    # A phone number for someone at this address
    phone: String!

    # Postal code
    postal: String!

    # Region. For example, a U.S. state
    region: String!
  }

  # Represents a physical or mailing address somewhere on Earth
  type Address implements Node {
    # The address ID
    _id: ID!

    # The street address / first line
    address1: String!

    # Optional second line
    address2: String

    # City
    city: String!

    # Optional company name, if it's a business address
    company: String

    # Country
    country: String!

    # Whether this address failed external address validation the last time it was checked
    failedValidation: Boolean

    # The full name of a person at this address
    fullName: String!

    # Is this the default address for billing purposes?
    isBillingDefault: Boolean!

    # Is this a commercial address?
    isCommercial: Boolean!

    # Is this the default address to use when selecting a shipping address at checkout?
    isShippingDefault: Boolean!

    # Arbitrary additional metadata about this address
    metafields: [Metafield]

    # A phone number for someone at this address
    phone: String!

    # Postal code
    postal: String!

    # Region. For example, a U.S. state
    region: String!
  }

  # Wraps a list of \`Addresses\`, providing pagination cursors and information.
  type AddressConnection implements NodeConnection {
    edges: [AddressEdge]
    nodes: [Address]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # A connection edge in which each node is an \`Address\` object
  type AddressEdge implements NodeEdge {
    cursor: ConnectionCursor!
    node: Address
  }
`;
