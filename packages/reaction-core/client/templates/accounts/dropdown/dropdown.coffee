Template.loginDropdown.events
  "click .dropdown-menu": (event) ->
    event.stopPropagation()

  "click #logout": (event, template) ->
    Session.set 'displayDashboardNavBar', false
    Meteor.logout (err) ->
      Meteor._debug err if err
    event.preventDefault()
    template.$('.dropdown-toggle').dropdown('toggle') # close dropdown

  "click .user-accounts-dropdown a": (event, template) ->
    if @.overviewRoute is "createProduct"
      event.preventDefault()
      Meteor.call "createProduct", (error, productId) ->
        if error
          console.log error
        else if productId
          Router.go "product",
            _id: productId
          return
    if @.overviewRoute
      event.preventDefault()
      template.$('.dropdown-toggle').dropdown('toggle') # close dropdown
      Router.go(@.overviewRoute)
