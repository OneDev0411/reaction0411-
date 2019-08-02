import mockContext from "/imports/test-utils/helpers/mockContext";
import bulkAddTagsToProducts from "./bulkAddTagsToProducts";

const mockInput = {
  input: {
    productIds: ["BCTMZ6HTxFSppJESk", "XWTMZ6HTxFSppJESo"],
    tagIds: ["cseCBSSrJ3t8HQSNP", "YCeCBSSrJ3t8HQSxx"]
  }
};

const expectedResults = {
  foundCount: 2,
  notFoundCount: 0,
  updatedCount: 2,
  writeErrors: []
};

test("Testing bulkAddTagsToProducts, returns info on the results of the bulk write", async () => {
  const { input } = mockInput;
  const results = await bulkAddTagsToProducts(mockContext, input);

  expect(mockContext.collections.Products.bulkWrite).toHaveBeenCalled();
  expect(results).toEqual(expectedResults);
});
