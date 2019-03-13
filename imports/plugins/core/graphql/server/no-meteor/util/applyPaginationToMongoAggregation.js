const DEFAULT_LIMIT = 20;

/**
 * @name applyPaginationToMongoAggregation
 * @method
 * @memberof GraphQL/ResolverUtilities
 * @summary Returns results of Mongo Aggregation, with first and after or last and before args applied
 * @param {Object} aggregationParams An object containing the collection and aggregation pipeline
 * @param {MongoCollection} [aggregationParams.collection] - Mongo collection is run the aggregation on
 * @param {Array} [aggregationParams.pipeline] - Mongo aggregation pipeline array
 * @param {Object} args - Connection arguments from GraphQL query
 * @param {String} [args.after] - ID  of the cursor result
 * @param {String} [args.before] - ID of the cursor result
 * @param {Integer} [args.first] - Number of results to return after the `after`
 * @param {Integer} [args.last] -  Number of results to return before the `before`
 * @return {Promise<Object>} `{ totalCount, pageInfo: { hasNextPage, hasPreviousPage }, nodes }`
 */
export default async function applyPaginationToMongoAggregation(aggregationParams, { first, last, before, after } = {}) {
  const { collection, pipeline } = aggregationParams;

  if (first && last) throw new Error("Request either `first` or `last` but not both");

  // Facet: Add pageInfo and count
  const facet = {
    $facet: {
      nodes: [
        { $skip: 0 }
      ],
      pageInfo: [
        { $count: "totalCount" }
      ]
    }
  };

  const unpaginatedResults = await collection.aggregate([...pipeline, facet]).toArray();

  let hasPreviousPage;
  let hasNextPage;
  let paginatedCatalogItems;
  let totalCount;

  if (unpaginatedResults[0].nodes.length === 0) {
    totalCount = unpaginatedResults[0].nodes.length;
    hasNextPage = false;
    hasPreviousPage = false;
    paginatedCatalogItems = unpaginatedResults[0].nodes;
  } else {
    const unpaginatedCatalogItems = unpaginatedResults[0].nodes;
    // eslint-disable-next-line prefer-destructuring
    totalCount = unpaginatedResults[0].pageInfo[0].totalCount;
    if (after) {
      const indexOfCursor = unpaginatedCatalogItems.findIndex((catalogItem) => catalogItem._id === after);
      if (first) {
        hasPreviousPage = indexOfCursor > 0;
        hasNextPage = ((totalCount - (first + indexOfCursor - 1)) > 0);
        paginatedCatalogItems = unpaginatedCatalogItems.slice(indexOfCursor + 1, indexOfCursor + 1 + first);
      }
    } else if (before) {
      const indexOfCursor = unpaginatedCatalogItems.findIndex((catalogItem) => catalogItem._id === before);
      if (last) {
        hasPreviousPage = totalCount > (indexOfCursor + last);
        hasNextPage = totalCount > indexOfCursor;
        const startIndex = ((indexOfCursor - 1 - last) > 0) ? (indexOfCursor - 1 - last) : 0;
        paginatedCatalogItems = unpaginatedCatalogItems.slice(startIndex, indexOfCursor);
      }
    } else {
      const startIndex = 0;
      const limit = first || last || DEFAULT_LIMIT;
      hasPreviousPage = false;
      hasNextPage = (totalCount - limit) > 0;
      paginatedCatalogItems = unpaginatedCatalogItems.slice(startIndex, startIndex + limit);
    }
  }

  return {
    totalCount,
    pageInfo: { hasNextPage, hasPreviousPage },
    nodes: paginatedCatalogItems
  };
}
