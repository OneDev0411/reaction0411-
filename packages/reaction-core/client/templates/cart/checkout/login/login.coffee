loginButtonsSession = Accounts._loginButtonsSession

Template.checkoutLogin.onRendered = ->
  # initial screen in checkout should be to create an account
  loginButtonsSession.set "inSignupFlow", true

Template.checkoutLogin.helpers
  allowGuestCheckout: ->
    return ReactionCore.allowGuestCheckout
