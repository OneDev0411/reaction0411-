Template.variant.helpers
  progressBar: () ->
    if @.inventoryPercentage <= 10 then "progress-bar-danger"
    else if @.inventoryPercentage <= 30 then "progress-bar-warning"
    else "progress-bar-success"

  selectedVariant: () ->
    current = selectedVariant()
    if (@._id is current?._id) or  (@._id is current?.parentId)
      return "variant-detail-selected"

  displayPrice: () ->
    return getVariantPriceRange(@_id)

  isSoldOut: () ->
      if @.inventoryQuantity < 1
          return true
      return false

Template.variant.events
  "click .variant-edit": (event) ->
    setCurrentVariant @._id
    toggleSession "variant-form-"+@._id

  "dblclick .variant-detail": (event) ->
    if ReactionCore.hasPermission('createProduct')
      setCurrentVariant @._id
      toggleSession "variant-form-"+@._id

  "click .variant-detail > *": (event) ->
    event.preventDefault()
    event.stopPropagation()
    Alerts.removeSeen()
    setCurrentVariant @._id

Template.variant.onRendered ->
  @autorun ->
    if ReactionCore.hasPermission('createProduct')
      variantSort = $(".variant-list")
      variantSort.sortable
          items: "> li.variant-list-item"
          cursor: "move"
          opacity: 0.3
          helper: "clone"
          placeholder: "variant-sortable"
          forcePlaceholderSize: true
          axis: "y"
          update: (event, ui) ->
            productVariants = selectedProduct()?.variants
            uiPositions = $(this).sortable("toArray",attribute:"data-id")
            newVariants = []

            for id, index in uiPositions
              for variant, pindex in productVariants
                if variant?._id is id
                  newVariants[index] = variant
                  delete productVariants[pindex]

            updateVariants = _.union productVariants, newVariants
            Meteor.defer ->
              Meteor.call "updateVariants", updateVariants

          start: (event, ui) ->
            ui.placeholder.height ui.helper.height()
            ui.placeholder.html "Drop variant to reorder"
            ui.placeholder.css "padding-top", ui.helper.height() / 3
            ui.placeholder.css "border", "1px dashed #ccc"
            ui.placeholder.css "border-radius","6px"
