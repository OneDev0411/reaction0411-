ReactionCore.registerPackage({
  label: "Products",
  name: "reaction-product-variant",
  icon: "fa fa-cubes",
  autoEnable: true,
  registry: [{
    route: "/product/:handle/:variantId?",
    name: "product",
    template: "productDetail",
    workflow: "coreProductWorkflow"
  }, {
    route: "/tag/:slug?",
    name: "tag",
    template: "products",
    workflow: "coreProductWorkflow"
  }, {
    route: "/products/createProduct",
    name: "createProduct",
    label: "Add Product",
    icon: "fa fa-plus",
    template: "productDetail",
    provides: "shortcut",
    container: "addItem",
    priority: 1,
    permissions: [{
      label: "Create Product",
      permission: "createProduct"
    }]
  }],
  layout: [{
    layout: "coreLayout",
    workflow: "coreProductWorkflow",
    collection: "Products",
    theme: "default",
    enabled: true,
    structure: {
      template: "productDetail",
      layoutHeader: "layoutHeader",
      layoutFooter: "",
      notFound: "productNotFound",
      dashboardHeader: "",
      dashboardControls: "dashboardControls",
      dashboardHeaderControls: "",
      adminControlsFooter: "adminControlsFooter"
    }
  }]
});
