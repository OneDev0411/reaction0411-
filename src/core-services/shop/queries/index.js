export default {
  shopById: (context, _id) => context.dataLoaders.Shops.load(_id),
  shopBySlug: (context, slug) => context.collections.Shops.findOne({ slug }),
  primaryShop: async (context) => {
    const { collections, rootUrl } = context;
    const { Shops } = collections;
    const domain = new URL(rootUrl).hostname;
    let shop = await Shops.findOne({ domains: domain });
    if (!shop) {
      shop = await Shops.findOne({ shopType: "primary" });
    }
    return shop;
  }
};
