Template.variantList.helpers
  variants: () ->
    product = selectedProduct()
    if product
      variants = (variant for variant in product.variants when !variant.parentId?)
      inventoryTotal = 0
      for variant in variants
        unless isNaN(variant.inventoryQuantity)
          inventoryTotal +=  variant.inventoryQuantity
      for variant in variants
        @variant
        variant.inventoryTotal = inventoryTotal
        variant.inventoryPercentage = parseInt((variant.inventoryQuantity / inventoryTotal) * 100)
        variant.inventoryWidth = parseInt((variant.inventoryPercentage - variant.title?.length ))
      variants

  childVariants: () ->
    product = selectedProduct()
    if product
      current = selectedVariant()
      if current?._id
        if current.parentId?
          variants = (variant for variant in product.variants when variant.parentId is current.parentId and variant.optionTitle and variant.type != 'inventory')
        else
          variants = (variant for variant in product.variants when variant.parentId is current._id and variant.optionTitle and variant.type != 'inventory')
        return variants

Template.variantList.events
  # "submit form": (event,template) ->
  #   unless selectedVariantId() is template.data._id
  #     setCurrentVariant template.data._id

  "click #create-variant": (event) ->
    Meteor.call "createVariant", @._id

  "click .variant-select-option": (event,template) ->
    template.$(".variant-select-option").removeClass("active")
    $(event.target).addClass("active")
    Alerts.removeSeen()
    setCurrentVariant @._id
