Template.orders.helpers
  orders: ->
    return Orders.find()
  isOrder: ->
    if @._id
      return true
    else
      return false
  fulfillmentWorkflow: ->
    # to define fulfillment workflow, alter OrderWorkflowEvents
    fulfillmentWorkflow = []
    for key of OrderWorkflow
      for events,index in OrderWorkflowEvents
        if events.name is key
          count = Orders.find({status: key}).count()
          value = key
          if (count > 0 or displayNext isnt false)
            if count is 0
              displayNext = false
              finalEvent = index: index, count: count, value: value, label: events.label
            else
              displayNext = true
              fulfillmentWorkflow.push {index: index, count: count, value: value, label: events.label}

    fulfillmentWorkflow.push finalEvent
    return fulfillmentWorkflow
