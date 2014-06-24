Template.variantForm.helpers
  variantDetails: ->
    product  = currentProduct.get "product"
    unless @.parentId?
      Template.parentVariantForm
    else
      Template.childVariantForm

  childVariants: () ->
    product  = currentProduct.get "product"
    variants = (variant for variant in product.variants when variant?.parentId is this._id)
    if variants then return variants

  nowDate: () ->
    new Date()

  variantFormId: () ->
    "variant-form-"+@._id

  variantFormVisible: () ->
    unless Session.equals "variant-form-"+@._id, true
      return "hidden"

  displayInventoryManagement: () ->
    unless @inventoryManagement is true
      return "display:none;"

  displayLowInventoryWarning: () ->
    unless @inventoryManagement is true
      return "display:none;"

Template.variantForm.events
  "submit form": (event,template) ->
    currentProduct.changed "product"

  "change input[name='inventoryManagement']": (event,template) ->
    formId = "variant-form-"+template.data
    if !$( event.currentTarget ).is(':checked')
        $( '#' + formId ).find( 'input[name=inventoryPolicy]' ).attr("checked",false)
    $( '#' + formId ).find( '.inventoryPolicy, .lowInventoryWarningThreshold' ).fadeToggle()

  "click .btn-child-variant-form": (event,template) ->
    event.stopPropagation()
    event.preventDefault()
    product  = currentProduct.get "product"
    Meteor.call("cloneVariant",product._id, template.data._id, @._id)

  "click .btn-remove-variant": (event, template) ->
    if confirm("Are you sure you want to delete "+ @.title)
      Meteor.call "deleteVariant", @._id


  "click .btn-clone-variant": (event,template) ->
    event.stopPropagation()
    event.preventDefault()
    productId = (currentProduct.get "product")._id
    Meteor.call "cloneVariant", productId, template.data._id, (error, result) ->
      if result
        Deps.flush()
        event.preventDefault()
        event.stopPropagation()

