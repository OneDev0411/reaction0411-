Template.layoutHeader.events
  'click #login-dropdown-list a.dropdown-toggle': () ->
    setTimeout (->
      $("#login-email").focus()
    ), 100
  # clears dashboard active links. needs a better approach.
  'click .header-tag, click .navbar-brand': () ->
    $('.dashboard-navbar-packages ul li').removeClass('active')