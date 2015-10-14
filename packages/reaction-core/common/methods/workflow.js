Meteor.methods({
  /**
   * workflow/pushCartWorkflow
   * updates cart workflow status
   * status in the workflow is stored as the current active
   * workflow step.
   *
   * first sets, second call moves status to next workflow
   * additional calls do nothing
   * user permissions to template are verified
   *
   */
  /* eslint no-shadow: 0 */

  "workflow/pushCartWorkflow": function (workflow, newWorkflowStatus,
    cartId) {
    check(workflow, String);
    check(newWorkflowStatus, String);
    check(cartId, Match.Optional(String));
    this.unblock();

    let defaultPackageWorkflows = [];
    let nextWorkflowStep = {
      template: ""
    };
    let Cart = ReactionCore.Collections.Cart;
    let currentCart = Cart.findOne({
      userId: Meteor.userId()
    });

    // exit if a cart doesn't exist.
    if (!currentCart) return [];

    let currentWorkflowStatus = currentCart.workflow.status;
    let Packages = ReactionCore.Collections.Packages.find({
      "shopId": ReactionCore.getShopId(),
      "layout.workflow": workflow
    });

    // loop through packages and set the defaultPackageWorkflows
    Packages.forEach(function (reactionPackage) {
      let layouts = _.where(reactionPackage.layout, {
        workflow: workflow
      });
      // for every layout, process the associated workflows
      _.each(layouts, function (layout) {
        // audience is the layout permissions
        if (layout.audience === undefined) {
          let defaultRoles = ReactionCore.Collections.Shops.findOne(
            ReactionCore.getShopId(), {
              sort: {
                priority: 1
              }
            }).defaultRoles;
          layout.audience = defaultRoles;
        }
        // check permissions so you don't have to on template.
        if (ReactionCore.hasPermission(layout.audience)) {
          defaultPackageWorkflows.push(layout);
        }
      });
    });

    // statusExistsInWorkflow boolean
    let statusExistsInWorkflow = _.contains(currentCart.workflow.workflow,
      newWorkflowStatus);

    let maxSteps = defaultPackageWorkflows.length;
    let nextWorkflowStepIndex;
    let templateProcessedinWorkflow = false;
    let gotoNextWorkflowStep = false;

    // if we haven't populated workflows lets exit
    if (!defaultPackageWorkflows.length > 0) {
      return [];
    }

    // loop through all shop configured layouts, and their default workflows
    // to determine what the next workflow step should be
    // the cart workflow status while processing is neither true nor false (set to template)
    _.each(defaultPackageWorkflows, function (workflow,
      currentStatusIndex) {
      if (workflow.template === currentWorkflowStatus) {
        // don't go past the end of the workflow
        if (currentStatusIndex < maxSteps - 1) {
          ReactionCore.Log.debug("currentStatusIndex, maxSteps",
            currentStatusIndex, maxSteps);
          nextWorkflowStepIndex = currentStatusIndex + 1;
        } else {
          nextWorkflowStepIndex = currentStatusIndex;
        }

        ReactionCore.Log.debug("nextWorkflowStepIndex",
          nextWorkflowStepIndex);
        // set the nextWorkflowStep as the next workflow object from registry
        nextWorkflowStep = defaultPackageWorkflows[
          nextWorkflowStepIndex];

        ReactionCore.Log.debug("setting nextWorkflowStep",
          nextWorkflowStep.template);
      }
    });

    // check to see if the next step has aready been processed.
    // templateProcessedinWorkflow boolean
    gotoNextWorkflowStep = nextWorkflowStep.template;
    templateProcessedinWorkflow = _.contains(currentCart.workflow.workflow,
      nextWorkflowStep.template);

    // debug info
    ReactionCore.Log.debug("currentWorkflowStatus:",
      currentWorkflowStatus);
    ReactionCore.Log.debug("workflow/pushCartWorkflow workflow:",
      workflow);
    ReactionCore.Log.debug("newWorkflowStatus: ", newWorkflowStatus);
    ReactionCore.Log.debug("current cartId: ", currentCart._id);
    ReactionCore.Log.debug("currentWorkflow: ", currentCart.workflow.workflow);
    ReactionCore.Log.debug("nextWorkflowStep: ", nextWorkflowStep.template);
    ReactionCore.Log.debug("statusExistsInWorkflow: ",
      statusExistsInWorkflow);
    ReactionCore.Log.debug("templateProcessedinWorkflow: ",
      templateProcessedinWorkflow);
    ReactionCore.Log.debug("gotoNextWorkflowStep: ",
      gotoNextWorkflowStep);

    // Condition One
    // if you're going to join the workflow you need a status that is a template name.
    // this status/template is how we know
    // where you are in the flow and configures `gotoNextWorkflowStep`

    if (!gotoNextWorkflowStep && currentWorkflowStatus !==
      newWorkflowStatus) {
      ReactionCore.Log.debug(
        "######## Condition One #########: initialise the " + workflow +
        ":  " + defaultPackageWorkflows[0].template);
      return Cart.update(currentCart._id, {
        $set: {
          "workflow.status": defaultPackageWorkflows[0].template
        }
      });
    }

    // Condition Two
    // your're now accepted into the workflow,
    // but to begin the workflow you need to have a next step
    // and you should have already be in the current workflow template
    if (gotoNextWorkflowStep && statusExistsInWorkflow === false &&
      templateProcessedinWorkflow === false) {
      ReactionCore.Log.debug(
        "######## Condition Two #########: set status to: ",
        nextWorkflowStep.template);

      return Cart.update(currentCart._id, {
        $set: {
          "workflow.status": nextWorkflowStep.template
        },
        $addToSet: {
          "workflow.workflow": currentWorkflowStatus
        }
      });
    }

    // Condition Three
    // If you got here by skipping around willy nilly
    // we're going to do our best to ignore you.
    if (gotoNextWorkflowStep && statusExistsInWorkflow === true &&
      templateProcessedinWorkflow === false) {
      ReactionCore.Log.debug(
        "######## Condition Three #########: complete workflow " +
        currentWorkflowStatus + " updates and move to: ",
        nextWorkflowStep.template);
      return Cart.update(currentCart._id, {
        $set: {
          "workflow.status": nextWorkflowStep.template
        },
        $addToSet: {
          "workflow.workflow": currentWorkflowStatus
        }
      });
    }

    // Condition Four
    // you got here through hard work, and processed the previous template
    // nice job. now start over with the next step.
    if (gotoNextWorkflowStep && statusExistsInWorkflow === true &&
      templateProcessedinWorkflow === true) {
      ReactionCore.Log.debug(
        "######## Condition Four #########: previously ran, doing nothing. : ",
        newWorkflowStatus);
      return true;
    }
  },

  /**
   * workflow/pushOrderWorkflow
   * updates order workflow status
   * status in the workflow is stored as the current active
   * workflow step.
   *
   * first sets, second call moves status to next workflow
   * additional calls do nothing
   * user permissions to template are verified
   *
   */

  "workflow/pushOrderWorkflow": function (workflow, newWorkflowStatus,
    orderId) {
    check(workflow, String);
    check(newWorkflowStatus, String);
    check(orderId, String);
    this.unblock();

    let defaultPackageWorkflows = [];
    let nextWorkflowStep = {
      template: ""
    };

    let Order = ReactionCore.Collections.Orders;
    let currentOrder = Order.findOne(orderId);

    // exit if a cart doesn't exist.
    if (!currentOrder) return [];

    let currentWorkflowStatus = currentOrder.workflow.status;
    let Packages = ReactionCore.Collections.Packages.find({
      "layout.workflow": workflow
    });

    // loop through packages and set the defaultPackageWorkflows
    Packages.forEach(function (reactionPackage) {
      let layouts = _.where(reactionPackage.layout, {
        workflow: workflow
      });
      // for every layout, process the associated workflows
      _.each(layouts, function (layout) {
        // audience is the layout permissions
        if (layout.audience === undefined) {
          let defaultRoles = ReactionCore.Collections.Shops.findOne({}, {
            sort: {
              priority: 1
            }
          }).defaultRoles;
          layout.audience = defaultRoles;
        }

        // check permissions so you don't have to on template.
        if (ReactionCore.hasPermission(layout.audience)) {
          defaultPackageWorkflows.push(layout);
        }
      });
    });

    // statusExistsInWorkflow boolean
    let statusExistsInWorkflow = _.contains(currentOrder.workflow.workflow,
      newWorkflowStatus);

    let maxSteps = defaultPackageWorkflows.length;
    let nextWorkflowStepIndex;
    let templateProcessedinWorkflow = false;
    let gotoNextWorkflowStep = false;

    // loop through all shop configured layouts, and their default workflows
    // to determine what the next workflow step should be
    // the cart workflow status while processing is neither true nor false (set to template)

    _.each(defaultPackageWorkflows, function (workflow,
      currentStatusIndex) {
      if (workflow.template === currentWorkflowStatus) {
        // don't go past the end of the workflow
        if (currentStatusIndex < maxSteps - 1) {
          ReactionCore.Log.debug("currentStatusIndex, maxSteps",
            currentStatusIndex, maxSteps);
          nextWorkflowStepIndex = currentStatusIndex + 1;
        } else {
          nextWorkflowStepIndex = currentStatusIndex;
        }

        ReactionCore.Log.debug("nextWorkflowStepIndex",
          nextWorkflowStepIndex);
        // set the nextWorkflowStep as the next workflow object from registry
        nextWorkflowStep = defaultPackageWorkflows[
          nextWorkflowStepIndex];

        ReactionCore.Log.debug("setting nextWorkflowStep",
          nextWorkflowStep.template);
      }
    });

    // check to see if the next step has aready been processed.
    // templateProcessedinWorkflow boolean

    gotoNextWorkflowStep = nextWorkflowStep.template;
    templateProcessedinWorkflow = _.contains(currentOrder.workflow.workflow,
      nextWorkflowStep.template);

    // debug info
    ReactionCore.Log.debug("currentWorkflowStatus:",
      currentWorkflowStatus);
    ReactionCore.Log.debug("workflow/pushOrderWorkflow workflow:",
      workflow);
    ReactionCore.Log.debug("newWorkflowStatus: ", newWorkflowStatus);
    ReactionCore.Log.debug("current orderId: ", currentOrder._id);
    ReactionCore.Log.debug("currentWorkflow: ", currentOrder.workflow.workflow);
    ReactionCore.Log.debug("nextWorkflowStep: ", nextWorkflowStep.template);
    ReactionCore.Log.debug("statusExistsInWorkflow: ",
      statusExistsInWorkflow);
    ReactionCore.Log.debug("templateProcessedinWorkflow: ",
      templateProcessedinWorkflow);
    ReactionCore.Log.debug("gotoNextWorkflowStep: ",
      gotoNextWorkflowStep);

    // Condition One
    // if you're going to join the workflow you need a status that is a template name.
    // this status/template is how we know
    // where you are in the flow and configures `gotoNextWorkflowStep`

    if (!gotoNextWorkflowStep && currentWorkflowStatus !==
      newWorkflowStatus) {
      ReactionCore.Log.debug(
        "######## Condition One #########: initialise the " + workflow +
        ":  " + defaultPackageWorkflows[0].template);

      Meteor.call("orders/updateHistory", orderId,
        defaultPackageWorkflows[0].template);

      return Order.update(currentOrder._id, {
        $set: {
          "workflow.status": defaultPackageWorkflows[0].template
        }
      });
    }

    // Condition Two
    // your're now accepted into the workflow,
    // but to begin the workflow you need to have a next step
    // and you should have already be in the current workflow template
    if (gotoNextWorkflowStep && statusExistsInWorkflow === false &&
      templateProcessedinWorkflow === false) {
      ReactionCore.Log.debug(
        "######## Condition Two #########: set status to: ",
        nextWorkflowStep.template);

      Meteor.call("orders/updateHistory", orderId, nextWorkflowStep.template);

      return Order.update(currentOrder._id, {
        $set: {
          "workflow.status": nextWorkflowStep.template
        },
        $addToSet: {
          "workflow.workflow": currentWorkflowStatus
        }
      });
    }

    // Condition Three
    // If you got here by skipping around willy nilly
    // we're going to do our best to ignore you.
    if (gotoNextWorkflowStep && statusExistsInWorkflow === true &&
      templateProcessedinWorkflow === false) {
      ReactionCore.Log.debug(
        "######## Condition Three #########: complete workflow " +
        currentWorkflowStatus + " updates and move to: ",
        nextWorkflowStep.template);

      Meteor.call("orders/updateHistory", orderId, nextWorkflowStep.template);

      return Order.update(currentOrder._id, {
        $set: {
          "workflow.status": nextWorkflowStep.template
        },
        $addToSet: {
          "workflow.workflow": currentWorkflowStatus
        }
      });
    }

    // Condition Four
    // you got here through hard work, and processed the previous template
    // nice job. now start over with the next step.
    if (gotoNextWorkflowStep && statusExistsInWorkflow === true &&
      templateProcessedinWorkflow === true) {
      ReactionCore.Log.debug(
        "######## Condition Four #########: previously ran, doing nothing. : ",
        newWorkflowStatus);
      return true;
    }
  },

  /**
   * workflow/pushOrderWorkflow
   * updates order workflow status
   * status in the workflow is stored as the current active
   * workflow step.
   *
   * first sets, second call moves status to next workflow
   * additional calls do nothing
   * user permissions to template are verified
   *
   */
  "workflow/pushOrderShipmentWorkflow": function (workflow, newWorkflowStatus,
    orderId, shipmentId) {
    check(workflow, String);
    check(newWorkflowStatus, String);
    check(orderId, String);
    check(shipmentId, String);
    this.unblock();

    let defaultPackageWorkflows = [];
    let nextWorkflowStep = {
      template: ""
    };

    let Order = ReactionCore.Collections.Orders;
    let currentOrder = Order.findOne({
      "_id": orderId,
      "shipping._id": shipmentId
    });

    // exit if a shipment doesn't exist.
    if (!currentOrder.shipping[0]) return [];

    let currentShipment = currentOrder.shipping[0];

    let currentWorkflowStatus = currentShipment.workflow.status;
    let Packages = ReactionCore.Collections.Packages.find({
      "layout.workflow": workflow
    });

    // loop through packages and set the defaultPackageWorkflows
    Packages.forEach(function (reactionPackage) {
      let layouts = _.where(reactionPackage.layout, {
        workflow: workflow
      });
      // for every layout, process the associated workflows
      _.each(layouts, function (layout) {
        // audience is the layout permissions
        if (layout.audience === undefined) {
          let defaultRoles = ReactionCore.Collections.Shops.findOne({}, {
            sort: {
              priority: 1
            }
          }).defaultRoles;
          layout.audience = defaultRoles;
        }

        // check permissions so you don't have to on template.
        if (ReactionCore.hasPermission(layout.audience)) {
          defaultPackageWorkflows.push(layout);
        }
      });
    });

    // statusExistsInWorkflow boolean
    let statusExistsInWorkflow = _.contains(currentShipment.workflow.workflow,
      newWorkflowStatus);

    let maxSteps = defaultPackageWorkflows.length;
    let nextWorkflowStepIndex;
    let templateProcessedinWorkflow = false;
    let gotoNextWorkflowStep = false;

    // loop through all shop configured layouts, and their default workflows
    // to determine what the next workflow step should be
    // the cart workflow status while processing is neither true nor false (set to template)

    _.each(defaultPackageWorkflows, function (workflow,
      currentStatusIndex) {
      if (workflow.template === currentWorkflowStatus) {
        // don't go past the end of the workflow
        if (currentStatusIndex < maxSteps - 1) {
          ReactionCore.Log.debug("currentStatusIndex, maxSteps",
            currentStatusIndex, maxSteps);
          nextWorkflowStepIndex = currentStatusIndex + 1;
        } else {
          nextWorkflowStepIndex = currentStatusIndex;
        }

        ReactionCore.Log.debug("nextWorkflowStepIndex",
          nextWorkflowStepIndex);
        // set the nextWorkflowStep as the next workflow object from registry
        nextWorkflowStep = defaultPackageWorkflows[
          nextWorkflowStepIndex];

        ReactionCore.Log.debug("setting nextWorkflowStep",
          nextWorkflowStep.template);
      }
    });

    // check to see if the next step has aready been processed.
    // templateProcessedinWorkflow boolean

    gotoNextWorkflowStep = nextWorkflowStep.template;
    templateProcessedinWorkflow = _.contains(currentShipment.workflow.workflow,
      nextWorkflowStep.template);

    // debug info
    ReactionCore.Log.debug("currentWorkflowStatus:",
      currentWorkflowStatus);
    ReactionCore.Log.debug("workflow/pushOrderWorkflow workflow:",
      workflow);
    ReactionCore.Log.debug("newWorkflowStatus: ", newWorkflowStatus);
    ReactionCore.Log.debug("current orderId: ", currentOrder._id);
    ReactionCore.Log.debug("current shipmentId: ", currentShipment._id);
    ReactionCore.Log.debug("currentWorkflow: ", currentOrder.workflow.workflow);
    ReactionCore.Log.debug("nextWorkflowStep: ", nextWorkflowStep.template);
    ReactionCore.Log.debug("statusExistsInWorkflow: ",
      statusExistsInWorkflow);
    ReactionCore.Log.debug("templateProcessedinWorkflow: ",
      templateProcessedinWorkflow);
    ReactionCore.Log.debug("gotoNextWorkflowStep: ",
      gotoNextWorkflowStep);

    // Condition One
    // if you're going to join the workflow you need a status that is a template name.
    // this status/template is how we know
    // where you are in the flow and configures `gotoNextWorkflowStep`

    if (!gotoNextWorkflowStep && currentWorkflowStatus !==
      newWorkflowStatus) {
      ReactionCore.Log.debug(
        "######## Condition One #########: initialise the " + workflow +
        ":  " + defaultPackageWorkflows[0].template);

      Meteor.call("orders/updateHistory", orderId, defaultPackageWorkflows[0].template);

      return Order.update({
        "_id": currentOrder._id,
        "shipment._id": currentShipment._id
      }, {
        $set: {
          "shipping.$.workflow.status": defaultPackageWorkflows[0].template
        }
      });
    }

    // Condition Two
    // your're now accepted into the workflow,
    // but to begin the workflow you need to have a next step
    // and you should have already be in the current workflow template
    if (gotoNextWorkflowStep && statusExistsInWorkflow === false &&
      templateProcessedinWorkflow === false) {
      ReactionCore.Log.debug(
        "######## Condition Two #########: set status to: ",
        nextWorkflowStep.template);

      Meteor.call("orders/updateHistory", orderId, nextWorkflowStep.template);

      return Order.update({
        "_id": currentOrder._id,
        "shipment._id": currentShipment._id
      }, {
        $set: {
          "shipping.$.workflow.status": nextWorkflowStep.template
        },
        $addToSet: {
          "shipping.$.workflow.workflow": currentWorkflowStatus
        }
      });
    }

    // Condition Three
    // If you got here by skipping around willy nilly
    // we're going to do our best to ignore you.
    if (gotoNextWorkflowStep && statusExistsInWorkflow === true &&
      templateProcessedinWorkflow === false) {
      ReactionCore.Log.debug(
        "######## Condition Three #########: complete workflow " +
        currentWorkflowStatus + " updates and move to: ",
        nextWorkflowStep.template);

      Meteor.call("orders/updateHistory", orderId, nextWorkflowStep.template);

      return Order.update({
        "_id": currentOrder._id,
        "shipment._id": currentShipment._id
      }, {
        $set: {
          "shipping.$.workflow.status": nextWorkflowStep.template
        },
        $addToSet: {
          "shipping.$.workflow.workflow": currentWorkflowStatus
        }
      });
    }

    // Condition Four
    // you got here through hard work, and processed the previous template
    // nice job. now start over with the next step.
    if (gotoNextWorkflowStep && statusExistsInWorkflow === true &&
      templateProcessedinWorkflow === true) {
      ReactionCore.Log.debug(
        "######## Condition Four #########: previously ran, doing nothing. : ",
        newWorkflowStatus);
      return true;
    }
  }
});
