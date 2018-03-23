import { map } from "ramda";
import {
  assocAccountInternalId,
  assocAccountOpaqueId,
  decodeAccountOpaqueId,
  encodeAccountOpaqueId,
  xformAccountInput,
  xformAccountResponse
} from "./account";

const testId = "12345";
const testOpaqueId = "cmVhY3Rpb24vYWNjb3VudDoxMjM0NQ==";

test("encodeAccountOpaqueId returns an opaque, base64-encoded, Account namespaced id", () => {
  expect(encodeAccountOpaqueId(testId)).toBe(testOpaqueId);
});

test("assocAcountOpaqueId returns an Account-namespaced, opaque ID to an object", () => {
  const input = {
    _id: testId,
    foo: "baz"
  };
  expect(assocAccountOpaqueId(input)).toEqual({
    _id: testOpaqueId,
    foo: "baz"
  });
});

test("decodeAccountOpaqueId returns the internal ID from opaque ID", () => {
  expect(decodeAccountOpaqueId(testOpaqueId)).toBe(testId);
});

test("assocAccountInternalId transforms the _id on an object from Address-namespaced opaque ID to internal", () => {
  const input = {
    _id: testOpaqueId,
    foo: "baz"
  };
  expect(assocAccountInternalId(input)).toEqual({
    _id: testId,
    foo: "baz"
  });
});

const accountInput = {
  _id: "00000",
  acceptsMarketing: true,
  createdAt: "2018-03-13T00:00:00Z",
  emails: [
    { provides: "default", address: "test@example.com", verified: true }
  ],
  groups: { type: "GroupConnection" },
  metafields: [{ type: "Metafield" }],
  name: "User Name",
  note: "This is a note.",
  profile: {
    addressBook: { type: "AddressConnection" },
    currency: { type: "Currency" },
    preferences: { foo: "baz" }
  },
  sessions: ["1", "2", "3"],
  shop: { type: "Shop" },
  state: "new",
  taxSettings: { type: "TaxSettings" },
  updatedAt: "2018-03-13T00:00:00Z",
  user: { type: "User" },
  username: "username"
};

const expectedResponse = {
  _id: "cmVhY3Rpb24vYWNjb3VudDowMDAwMA==",
  addressBook: { type: "AddressConnection" },
  createdAt: "2018-03-13T00:00:00Z",
  emailRecords: [
    { provides: "default", address: "test@example.com", verified: true }
  ],
  currency: { type: "Currency" },
  groups: { type: "GroupConnection" },
  metafields: [{ type: "Metafield" }],
  name: "User Name",
  note: "This is a note.",
  preferences: { foo: "baz" },
  shop: { type: "Shop" },
  taxSettings: { type: "TaxSettings" },
  updatedAt: "2018-03-13T00:00:00Z",
  user: { type: "User" }
};

const accountInternal = {
  _id: "00000",
  createdAt: "2018-03-13T00:00:00Z",
  emails: [
    { provides: "default", address: "test@example.com", verified: true }
  ],
  groups: { type: "GroupConnection" },
  metafields: [{ type: "Metafield" }],
  name: "User Name",
  note: "This is a note.",
  profile: {
    addressBook: { type: "AddressConnection" },
    currency: { type: "Currency" },
    preferences: { foo: "baz" }
  },
  shop: { type: "Shop" },
  taxSettings: { type: "TaxSettings" },
  updatedAt: "2018-03-13T00:00:00Z",
  user: { type: "User" }
};

test("xformAccountResponse transforms internal account to response schema", () => {
  expect(xformAccountResponse(accountInput)).toEqual(expectedResponse);
});

test("xformAccountResponse can be applied to map with an array of input", () => {
  expect(map(xformAccountResponse, [accountInput])).toEqual([expectedResponse]);
});

test("xformAccountInput transforms Account schema to internal account", () => {
  expect(xformAccountInput(expectedResponse)).toEqual(accountInternal);
});

test("xformAccountInput can be applied to map with an array of input", () => {
  expect(map(xformAccountInput, [expectedResponse])).toEqual([accountInternal]);
});
