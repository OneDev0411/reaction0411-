Template.childVariantForm.helpers
  childVariantFormId: () ->
    "child-variant-form-"+@._id

  hasInventoryVariants: () ->
    if checkInventoryVariants(@_id) > 0 then return true
    
  inventoryVariants: () ->
    product = selectedProduct()
    return unless product
    return (variant for variant in product.variants when variant?.parentId is @_id and variant.type is 'inventory').reverse()

  showInventoryVariants: () ->
    if Session.get("showInventoryVariants"+@._id)
      return ''
    else
      return 'hidden'
  
  editInventoryToggleText: () ->
    if Session.get("showInventoryVariants"+@._id)
      return i18n.t("productDetail.hideBarcodes")
    else
      return i18n.t("productDetail.showBarcodes")

Template.childVariantForm.events
  "click .child-variant-form :input, click li": (event,template) ->
    setCurrentVariant template.data._id

  "click .edit-inventory-variants": (event,template) ->
    showInventoryVariantsId = "showInventoryVariants"+@._id
    unless Session.get(showInventoryVariantsId)
      Session.set(showInventoryVariantsId, true)
    else
      Session.set(showInventoryVariantsId, false)
  
  "click .init-inventory-variants": (event, template) ->
    showInventoryVariantsId = "showInventoryVariants"+@._id
    Session.set(showInventoryVariantsId, true)
    productId = selectedProductId()
    Meteor.call "createInventoryVariants", productId, @._id, @.inventoryQuantity, "default"
    

  "change .child-variant-form :input": (event,template) ->
    productId = selectedProductId()
    variant = template.data
    value = $(event.currentTarget).val()
    field = $(event.currentTarget).attr('name')
    variant[field] = value
    Meteor.call "updateVariant", variant, (error,result) ->
      if error then throw new Meteor.Error "error updating variant", error
    setCurrentVariant template.data._id

  "click #remove-child-variant": (event, template) ->
    event.stopPropagation()
    event.preventDefault()
    optionTitle = @.optionTitle || "this option"
    if confirm("Are you sure you want to delete "+ optionTitle)
      id = @._id
      Meteor.call "deleteVariant", id, (error, result) ->
        if result and selectedVariantId() is id
          setCurrentVariant null
