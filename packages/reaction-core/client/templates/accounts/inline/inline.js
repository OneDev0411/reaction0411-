Template.loginInline.events({
  'click .continue-guest': function(event, template) {
    event.preventDefault();
    return Meteor.call("layout/pushWorkflow", "coreCartWorkflow", 'checkoutLogin');
  }
});
