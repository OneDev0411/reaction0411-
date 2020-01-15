import hasPermission from "./hasPermission.js";

test("returns false if no account", async () => {
  const result = await hasPermission({ account: null }, "resource", "action", { shopId: "scope" });
  expect(result).toBe(false);
});

test("returns false if no account.permissions", async () => {
  const result = await hasPermission({ account: { permissions: null } }, "resource", "action", { shopId: "scope" });
  expect(result).toBe(false);
});

test("throws if no resource", async () => {
  const result = hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["can_eat"]
        }
      }
    },
    null,
    "action",
    { shopId: "scope" }
  );
  expect(result).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if no action", async () => {
  const result = hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["can_eat"]
        }
      }
    },
    "organization:system:entity",
    null,
    { shopId: "scope" }
  );
  expect(result).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if no authContext", async () => {
  const result = hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["can_eat"]
        }
      }
    },
    "organization:system:entity",
    "action",
    null
  );
  expect(result).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if shopId is present but not a string", async () => {
  const result = hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["can_eat"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: ["thisIsNotAString"]
    }
  );
  expect(result).rejects.toThrowErrorMatchingSnapshot();
});

test("throws if shopId is present but an empty string", async () => {
  const result = hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["can_eat"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: ""
    }
  );
  expect(result).rejects.toThrowErrorMatchingSnapshot();
});

test("returns true if in global permissions, even if not in group-scope permissions", async () => {
  const result = await hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["otherOrganization:otherSystem:otherEntity/otherAction"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: "SHOP_ID"
    }
  );
  expect(result).toBe(true);
});

test("returns true if in group-scope permissions but not in global permissions", async () => {
  const result = await hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["otherOrganization:otherSystem:otherEntity/otherAction"], // eslint-disable-line camelcase
          scope: ["organization:system:entity/action"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: "scope"
    }
  );
  expect(result).toBe(true);
});

test("returns true if in permissions in both scopes", async () => {
  const result = await hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["organization:system:entity/action"], // eslint-disable-line camelcase
          scope: ["organization:system:entity/action"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: "scope"
    }
  );
  expect(result).toBe(true);
});

test("returns false if not in any permissions in either scope", async () => {
  const result = await hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["otherOrganization:otherSystem:otherEntity/otherAction"], // eslint-disable-line camelcase
          scope: ["can_eat"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: "scope"
    }
  );
  expect(result).toBe(false);
});

test("returns true if has owner permission, even if not explicitly in the permissions array", async () => {
  const result = await hasPermission(
    {
      account: {
        permissions: {
          __global_permissions__: ["otherOrganization:otherSystem:otherEntity/otherAction"], // eslint-disable-line camelcase
          scope: ["reaction:legacy:shops/owner"]
        }
      }
    },
    "organization:system:entity",
    "action",
    {
      shopId: "scope"
    }
  );
  expect(result).toBe(true);
});
