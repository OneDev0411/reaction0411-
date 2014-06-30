Template.productDetailTags.helpers
  currentHashTag: () ->
    if currentProduct.get("product")?.handle is @.name.toLowerCase()
      return true

Template.productTagInputForm.helpers
  hashtagMark: () ->
    if currentProduct.get("product")?.handle is @.name.toLowerCase()
      return "fa-bookmark"
    else
      return "fa-bookmark-o"

Template.productTagInputForm.events
  'click .tag-input-hashtag': (event,template) ->

    Meteor.call "setHandleTag", currentProduct.get("product")._id, @._id, (error,result) ->
      if result then Router.go "product", "_id": result

  'click .tag-input-group-remove': (event,template) ->
    Meteor.call "removeProductTag",currentProduct.get("product")._id, @._id

  'click .tags-input-select': (event,template) ->
    $(event.currentTarget).autocomplete(
      delay: 0
      autoFocus: true
      source: (request, response) ->
        datums = []
        slug = _.slugify(request.term)
        Tags.find({slug: new RegExp(slug, "i")}).forEach (tag) ->
          datums.push(
            label: tag.name
          )
        response(datums)
    )
    Deps.flush()

  'change .tags-input-select': (event,template) ->
    currentTag = Session.get "currentTag"
    Meteor.call "updateProductTags", currentProduct.get("product")._id, $(event.currentTarget).val(), @._id, currentTag
    $('#tags-submit-new').val('')
    $('#tags-submit-new').focus()
    # Deps.flush()

  'blur.autocomplete': (event,template) ->
    if $(event.currentTarget).val()
      currentTag = Session.get "currentTag"
      Meteor.call "updateProductTags", currentProduct.get("product")._id, $(event.currentTarget).val(), @._id, currentTag
      Deps.flush()
      $('#tags-submit-new').val('')
      $('#tags-submit-new').focus()

  'mousedown .tag-input-group-handle': (event,template) ->
    Deps.flush()
    $(".tag-edit-list").sortable("refresh")

Template.productTagInputForm.rendered = ->
  # *****************************************************
  # Inline field editing, handling
  # http://vitalets.github.io/x-editable/docs.html
  # *****************************************************
  $(".tag-edit-list").sortable
    items: "> li"
    handle: '.tag-input-group-handle'
    update: (event, ui) ->
      hashtagsList = []
      uiPositions = $(@).sortable("toArray", attribute:"data-tag-id")
      for tag,index in uiPositions
        if tag then hashtagsList.push tag

      Products.update(currentProduct.get("product")._id, {$set: {hashtags: hashtagsList}})
