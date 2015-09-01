//
// cartCheckout is a wrapper template
// controlling the load order of checkout step templates
//
//
// If you are looking for:
//  - cartWorkflow
//  - cartWorkflowPosition
//  - cartWorkflowCompleted
// see helpers/cart.coffee
//

Template.cartCheckout.helpers({
  cart: function () {
    return Cart.findOne();
  }
});


Template.cartCheckout.onRendered(function () {

  // ensure checkout drawer does not display
  Session.set("displayCartDrawer", false);

  // ensure that initial cart status is "checkoutLogin"
  Meteor.call("layout/pushWorkflow", "coreCartWorkflow", "checkoutLogin");

});


/**
 * checkoutStepBadge Helpers
 *
 */

Template.checkoutStepBadge.helpers({

  "checkoutStepBadgeClass": function () {
    var workflowStep = Template.instance().data;
    var currentStatus = ReactionCore.Collections.Cart.findOne().workflow.status;

    if (workflowStep.status === true || workflowStep.status == this.template ) {
      return "active";
    } else {
      return "";
    }
  }

});
