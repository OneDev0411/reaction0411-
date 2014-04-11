Meteor.methods
  ###
  # the cloneVariant method copies variants, but will also create and clone child variants (options)
  # productId,variantId to clone
  # add parentId to create children
  ###
  cloneVariant: (productId, variantId, parentId) ->
    product = Products.findOne(productId)
    variant = (variant for variant in product.variants when variant._id is variantId)
    clone = variant[0]

    #clean clone
    unless parentId
      clone.cloneId = productId
      clone._id = Random.id()
      delete clone.updatedAt
      delete clone.createdAt
      delete clone.inventoryQuantity
      delete clone.title
      Products._collection.update({_id:productId}, {$push: {variants: clone}})

    #make child clones
    children = (variant for variant in product.variants when variant.parentId is variantId)
    if children.length > 0 and !parentId
      # console.log "clone children"
      for childClone in children
        childClone._id = Random.id()
        childClone.parentId = clone._id
        Products._collection.update({_id:productId}, {$push: {variants: childClone}})
    else if parentId
      # console.log "create child clone"
      clone._id = Random.id()
      clone.parentId = variantId
      Products._collection.update({_id:productId}, {$push: {variants: clone}})

    return clone._id

  ###
  # initializes empty variant template (all others are clones)
  # should only be seen when all variants have been deleted from a product.
  ###
  createVariant: (productId) ->
    newVariant = { "_id": Random.id(), "title": "", "price": "0.00" }
    Products._collection.update({"_id": productId},{$addToSet:{"variants": newVariant}})

  ###
  # update individual variant with new values, merges into original
  # only need to supply updated information
  ###
  updateVariant: (variant) ->
    product = Products.findOne "variants._id":variant._id
    for variants,value in product.variants
      if variants._id is variant._id
        newVariant = _.extend variants,variant
    #TODO: check newVariant, ProductVariantSchema
    Products._collection.update({"_id":product._id,"variants._id":variant._id}, {$set: {"variants.$": newVariant}}, (error,result) ->
      console.log error if error
      return results if results
    )

  ###
  # update whole variants array
  ###
  updateVariants: (variants) ->
    product = Products.findOne "variants._id":variants[0]._id
    Products.update product._id, $set: variants: variants,(error,results) ->
      console.log error if error?

  ###
  # clone a whole product, defaulting visibility,etc
  # in the future we are going to do an inheritance product
  # that maintains relationships with the cloned
  # product tree
  ###
  cloneProduct: (product) ->
    #TODO: Really should be a recursive update of all _id
    i = 0
    handleCount = Products.find({"cloneId": product._id}).count() + 1
    product.cloneId = product._id
    product._id = Random.id()
    delete product.updatedAt
    delete product.createdAt
    delete product.publishedAt
    product.isVisible = false
    product.handle = product.handle + handleCount
    product.title = product.title + handleCount

    while i < product.variants.length
      product.variants[i]._id = Random.id()
      i++
    newProduct = Products._collection.insert(product)
    newProduct

  ###
  # when we create a new product, we create it with
  # an empty variant. all products have a variant
  # with pricing and details
  ###
  createProduct: () ->
    productId = Products._collection.insert({
      _id: Random.id()
      title: ""
      variants: [
        {
          _id: Random.id()
          title: ""
          price: 0.00
        }
      ]
    })

  ###
  # update single product field
  ###
  updateProductField: (productId, field,value) ->
    # value = Spacebars.SafeString(value)
    value  = EJSON.stringify value
    update = EJSON.parse "{\"" + field + "\":" + value + "}"
    return Products.update productId, $set: update


  ###
  # update product grid positions
  # position is an object with tag,position,dimensions
  ###
  updateProductPosition: (productId,positionData) ->
    unless Products.findOne({'_id' :productId,"positions.tag":positionData.tag})
      Products._collection.update {_id: productId},
        {$addToSet:{ positions:positionData },$set:{updatedAt:new Date() } },
      , (error,results) ->
        console.log error if error
    else
      #Collection2 doesn't support elemMatch, use core collection
      Products._collection.update
        "_id": productId
        "positions.tag": positionData.tag
        ,
          $set:
            "positions.$.position": positionData.position
            "updatedAt": new Date()
        ,
          (error,results) ->
            console.log error if error?
