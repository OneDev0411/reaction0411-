import { compose, withProps } from "recompose";
import { Meteor } from "meteor/meteor";
import { Accounts, Groups } from "/lib/collections";
import { Reaction, i18next } from "/client/api";
import { composeWithTracker } from "/lib/api/compose";
import AccountsDashboard from "../components/accountsDashboard";

const handlers = {
  handleUserGroupChange(account) {
    return (event, groupId) => {
      Meteor.call("group/addUser", account._id, groupId, (err) => {
        if (err) {
          return Alerts.toast(i18next.t("admin.groups.addUserError", { err: err.message }), "error");
        }
        return Alerts.toast(i18next.t("admin.groups.addUserSuccess"), "success");
      });
    };
  },

  handleRemoveUserFromGroup(account) {
    return () => {
      Meteor.call("group/removeUser", account._id, this.props.group._id, (err) => {
        if (err) {
          return Alerts.toast(i18next.t("admin.groups.removeUserError", { err: err.message }), "error");
        }
        return Alerts.toast(i18next.t("admin.groups.removeUserSuccess"), "success");
      });
    };
  }
};

const composer = (props, onData) => {
  const adminUserSub = Meteor.subscribe("Accounts", null);
  const grpSub = Meteor.subscribe("Groups");

  if (adminUserSub.ready() && grpSub.ready()) {
    const groups = Groups.find({ slug: { $nin: ["customer", "guest"] } }).fetch();
    const adminQuery = {
      [`roles.${Reaction.getShopId()}`]: {
        $in: ["dashboard"]
      }
    };

    const adminUsers = Meteor.users.find(adminQuery, { fields: { _id: 1 } }).fetch();
    const ids = adminUsers.map((user) => user._id);
    const accounts = Accounts.find({ _id: { $in: ids }, shopId: Reaction.getShopId() }).fetch();

    onData(null, { accounts, groups });
  }
};

export default compose(withProps(handlers), composeWithTracker(composer))(AccountsDashboard);
