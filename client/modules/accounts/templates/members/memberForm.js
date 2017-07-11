import { Reaction, i18next } from "/client/api";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { $ } from "meteor/jquery";


/**
 * memberForm events
 *
 */
Template.memberForm.events({
  "submit form": function (event, template) {
    event.preventDefault();

    const newMemberEmail = template.$('input[name="email"]').val();
    const newMemberName = template.$('input[name="name"]').val();

    return Meteor.call("accounts/inviteShopMember", Reaction.getShopId(),
      newMemberEmail, newMemberName, function (error, result) {
        if (error) {
          let message;
          if (error.reason === "Unable to send invitation email.") {
            message = i18next.t("accountsUI.error.unableToSendInvitationEmail");
          } else if (error.reason === "A user with this email address already exists") {
            message = i18next.t("accountsUI.error.userWithEmailAlreadyExists");
          } else if (error.reason !== "") {
            message = error;
          } else {
            message = `${i18next.t("accountsUI.error.errorSendingEmail")
            } ${error}`;
          }

          Alerts.inline(message, "error", {
            placement: "memberform"
          });

          template.$("input[type=text], input[type=email]").val("");

          return false;
        }
        if (result) {
          Alerts.toast(i18next.t("accountsUI.info.invitationSent",
            "Invitation sent."), "success");

          template.$("input[type=text], input[type=email]").val("");
          $(".settings-account-list").show();

          return true;
        }
      }
    );
  }
});
