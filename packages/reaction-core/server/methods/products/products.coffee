Media = ReactionCore.Collections.Media

Meteor.methods
  ###
  # the cloneVariant method copies variants, but will also create and clone child variants (options)
  # productId,variantId to clone
  # add parentId to create children
  ###
  cloneVariant: (productId, variantId, parentId) ->
    check productId, String
    check variantId, String
    check parentId, Match.Optional(String)
    # clone variant
    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    product = Products.findOne(productId)
    variant = (variant for variant in product.variants when variant._id is variantId)
    return false unless variant.length > 0

    clone = variant[0]
    clone._id = Random.id()

    if parentId
      ReactionCore.Events.debug "create child clone"
      clone.parentId = variantId
      delete clone.inventoryQuantity
      Products.update({_id:productId}, {$push: {variants: clone}}, {validate: false})
      return clone._id

    #clean clone
    clone.cloneId = productId
    delete clone.updatedAt
    delete clone.createdAt
    delete clone.inventoryQuantity
    delete clone.title
    Products.update({_id:productId}, {$push: {variants: clone}}, {validate: false})

    #make child clones
    children = (variant for variant in product.variants when variant.parentId is variantId)
    if children.length > 0
      ReactionCore.Events.debug "clone children"
      for childClone in children
        childClone._id = Random.id()
        childClone.parentId = clone._id
        Products.update({_id:productId}, {$push: {variants: childClone}}, {validate: false})

    return clone._id

  ###
  # initializes empty variant template (all others are clones)
  # should only be seen when all variants have been deleted from a product.
  ###
  createVariant: (productId, newVariant) ->
    check productId, String
    check newVariant, Match.OneOf(Object, undefined)

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"

    #create variant
    newVariantId = Random.id()
    if newVariant
      newVariant._id = newVariantId
      check(newVariant, ReactionCore.Schemas.ProductVariant)
    else
      newVariant = { "_id": newVariantId, "title": "", "price": "0.00" }
    Products.update({"_id": productId}, {$addToSet: {"variants": newVariant}}, {validate: false})
    return newVariantId

  ###
  # update individual variant with new values, merges into original
  # only need to supply updated information
  ###
  updateVariant: (variant, updateDoc, currentDoc) ->
    check variant, Object
    check updateDoc, Match.OptionalOrNull(Object)
    check currentDoc, Match.OptionalOrNull(String)

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    product = Products.findOne "variants._id":variant._id
    if product?.variants
      for variants,value in product.variants
        if variants._id is variant._id
          newVariant = _.extend variants,variant
      Products.update({"_id":product._id,"variants._id":variant._id}, {$set: {"variants.$": newVariant}}, {validate: false})


  ###
  # update whole variants array
  ###
  updateVariants: (variants) ->
    check variants, [Object]

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    product = Products.findOne "variants._id":variants[0]._id
    Products.update product._id, $set: variants: variants, {validate: false}


  ###
  # clone a whole product, defaulting visibility, etc
  # in the future we are going to do an inheritance product
  # that maintains relationships with the cloned
  # product tree
  ###
  cloneProduct: (product) ->
    check product, Object
    #check product, ReactionCore.Schemas.Product

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    #TODO: Really should be a recursive update of all _id
    i = 0
    handleCount = Products.find({"cloneId": product._id}).count() + 1

    #clean the product and give it a new ID and title
    product.cloneId = product._id
    product._id = Random.id()
    delete product.updatedAt
    delete product.createdAt
    delete product.publishedAt
    delete product.handle
    product.isVisible = false
    if product.title then product.title = product.title + handleCount

    #make new random IDs for all variants and maintain parent/child relationship
    while i < product.variants.length
      newVariantId = Random.id()
      oldVariantId = product.variants[i]._id
      product.variants[i]._id = newVariantId
      #clone images for each variant
      Media.find({'metadata.variantId': oldVariantId}).forEach (fileObj) ->
        newFile = fileObj.copy()
        newFile.update({$set: {'metadata.productId': product._id, 'metadata.variantId': newVariantId}})
      #update any child variants with the newly assigned ID
      unless product.variants[i].parentId
        while i < product.variants.length
          if product.variants[i].parentId == oldVariantId
            product.variants[i].parentId = newVariantId
          i++
      i++

    #create the cloned product
    return Products.insert(product, {validate: false})

  ###
  # delete variant, which should also delete child variants
  ###
  deleteVariant: (variantId) ->
    check variantId, String

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    #what will we be deleteing?
    deleted = Products.find({$or: [{"variants.parentId": variantId}, {"variants._id": variantId}]}).fetch()
    #delete variants with this variant as parent
    Products.update {"variants.parentId": variantId}, {$pull: 'variants': {'parentId': variantId}}
    #delete this variant
    Products.update {"variants._id": variantId}, {$pull: 'variants': {'_id': variantId}}
    # unlink media
    _.each deleted, (product) ->
      _.each product.variants, (variant) ->
        if variant.parentId is variantId or variant._id is variantId
          Media.update 'metadata.variantId': variant._id,
            $unset:
              'metadata.productId': ""
              'metadata.variantId': ""
              'metadata.priority': ""
          , multi: true
    return true

  ###
  # when we create a new product, we create it with
  # an empty variant. all products have a variant
  # with pricing and details
  ###
  createProduct: () ->
    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    Products.insert
      _id: Random.id()
      title: ""
      variants: [
        _id: Random.id()
        title: ""
        price: 0.00
      ]
    , validate: false

  ###
  # delete a product and unlink it from all media
  ###
  deleteProduct: (productId) ->
    check productId, String
    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"

    # delete product
    numRemoved = Products.remove productId
    if numRemoved > 0
      # unlink media
      Media.update 'metadata.productId': productId,
        $unset:
          'metadata.productId': ""
          'metadata.variantId': ""
          'metadata.priority': ""
      , multi: true
      return true
    else
      return false

  ###
  # update single product field
  ###
  updateProductField: (productId, field, value) ->
    check productId, String
    check field, String
    check value, String

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    # value = Spacebars.SafeString(value)
    value  = EJSON.stringify value
    update = EJSON.parse "{\"" + field + "\":" + value + "}"
    return Products.update productId, $set: update

  ###
  # method to insert or update tag with hierachy
  # tagName will insert
  # tagName + tagId will update existing
  ###
  updateProductTags: (productId, tagName, tagId, currentTagId) ->
    check productId, String
    check tagName, String
    check tagId, Match.OneOf(String, null)
    check currentTagId, Match.Optional(String)

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"

    newTag =
      slug: getSlug tagName
      name: tagName

    existingTag = Tags.findOne({"name": tagName})

    if existingTag
      productCount = Products.find({"_id": productId, "hashtags": {$in:[existingTag._id]}}).count()
      return false if productCount > 0
      Products.update(productId, {$push: {"hashtags": existingTag._id}})
    else if tagId
      Tags.update tagId, {$set: newTag}
    else # create a new tag
      # newTag.isTopLevel = !currentTagId
      newTag.isTopLevel = false
      newTag.shopId = ReactionCore.getShopId()
      newTag.updatedAt = new Date()
      newTag.createdAt = new Date()
      newTag._id = Tags.insert(newTag)
      Products.update(productId, {$push: {"hashtags": newTag._id}})
    return

  ###
  # remove product tag
  ###
  removeProductTag: (productId, tagId) ->
    check productId, String
    check tagId, String

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"

    Products.update(productId, {$pull: {"hashtags": tagId}})
    # if not in use delete from system
    productCount = Products.find({"hashtags": {$in: [tagId]}}).count()
    relatedTagsCount = Tags.find({"relatedTagIds": {$in: [tagId]}}).count()

    if (productCount is 0) and (relatedTagsCount is 0)
      Tags.remove(tagId)


  ###
  # set or toggle product handle
  ###
  setHandleTag: (productId, tagId) ->
    check productId, String
    check tagId, String

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"

    product = Products.findOne(productId)
    tag = Tags.findOne(tagId)
    #if is already assigned, unset (toggle off)
    if productId.handle is tag.slug
      Products.update(product._id, {$unset: {"handle": ""}})
      return product._id
    else
      existingHandles = Products.find({handle: tag.slug}).fetch()
      #reset any existing handle to product id
      for currentProduct in existingHandles
        Products.update(currentProduct._id, {$unset: {"handle": ""}})
      #update handle to tag.slug (lowercase tag)
      Products.update(product._id, {$set: {"handle": tag.slug}})
      return tag.slug

  ###
  # update product grid positions
  # position is an object with tag,position,dimensions
  ###
  updateProductPosition: (productId, positionData) ->
    check productId, String
    check positionData, Object

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"

    unless Products.findOne({'_id' : productId,"positions.tag": positionData.tag})
      Products.update {_id: productId},
        {$addToSet: { positions: positionData },$set: {updatedAt: new Date() } },
      , (error,results) ->
        ReactionCore.Events.warn error if error
    else
      #Collection2 doesn't support elemMatch, use core collection
      Products.update
        "_id": productId
        "positions.tag": positionData.tag
        ,
          $set:
            "positions.$.position": positionData.position
            "positions.$.updatedAt": new Date()
        ,
          (error,results) ->
            ReactionCore.Events.warn error if error

  updateMetaFields: (productId, updatedMeta, meta) ->
    check productId, String
    check updatedMeta, Object
    check meta, Match.OptionalOrNull(Object)

    unless Roles.userIsInRole Meteor.userId(), ['admin']
      throw new Meteor.Error 403, "Access Denied"
    if meta
      Products.update({"_id": productId, "metafields": meta}, {$set: {"metafields.$": updatedMeta} })
    else
      Products.update( "_id": productId, { "$addToSet": { "metafields": updatedMeta } })
