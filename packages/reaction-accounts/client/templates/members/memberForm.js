/**
 * memberForm events
 *
 */
Template.memberForm.events({
  "submit form": function (event, template) {
    event.preventDefault();

    let newMemberEmail = template.$('input[name="email"]').val();
    let newMemberName = template.$('input[name="name"]').val();

    return Meteor.call("accounts/inviteShopMember", ReactionCore.getShopId(),
      newMemberEmail, newMemberName, function (error, result) {
        if (error) {
          let message;
          if (error.reason === "Unable to send invitation email.") {
            message = i18next.t("accountsUI.error.unableToSendInvitationEmail");
          } else if (error.reason !== "") {
            message = error;
          } else {
            message = `${i18next.t("accountsUI.error.errorSendingEmail")
              } ${error}`;
          }
          Alerts.toast(message, "error", {
            html: true,
            timeout: 10000
          });
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
