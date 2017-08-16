import { Meteor } from "meteor/meteor";
import React from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import moment from "moment";
import { Components, registerComponent } from "@reactioncommerce/reaction-components";
import { Reaction } from "/client/api";
import { getGravatar } from "../helpers/accountsHelper";

const GroupsTableCell = ({ account, columnName, group, adminGroups, handleRemoveUserFromGroup, handleUserGroupChange, ...props }) => {
  const email = _.get(account, "emails[0].address");
  const groups = adminGroups;
  if (columnName === "name") {
    // use first part of email, if account has no name
    const name = account.name || email.split("@")[0];
    return (
      <div className="table-cell body-first">
        <img className="accounts-img-tag" src={getGravatar(account)} />
        <span><b>{name}</b></span>
      </div>
    );
  }

  if (columnName === "email") {
    return (
      <div className="table-cell body">
        <span>{email}</span>
      </div>
    );
  }

  if (columnName === "createdAt") {
    return (
      <div className="table-cell body created-at">
        <span>
          {moment(account.createdAt).format("MMM Do")}
        </span>
      </div>
    );
  }

  if (columnName === "dropdown") {
    const groupName = <span className="group-dropdown">{_.startCase(groups[0].name)}</span>;
    const ownerGroup = groups.find((grp) => grp.slug === "owner") || {};
    const hasOwnerAccess = Reaction.hasPermission("owner", Meteor.userId(), Reaction.getShopId());

    if (groups.length === 1) {
      return groupName;
    }

    if (group.slug === "owner") {
      return groupName;
    }

    const { onMethodDone, onMethodLoad } = props;
    const dropDownButton = (opt) => ( // eslint-disable-line
      <div className="group-dropdown">
        <Components.Button bezelStyle="solid" label={group.name && _.startCase(group.name)}>
          &nbsp;
          {opt && opt.length > 1 && // add icon only if there's more than the current group
            <i className="fa fa-chevron-down" />
          }
        </Components.Button>
      </div>
    );

    // Permission check. Remove owner option, if user is not current owner.
    // Also remove groups user does not have roles to manage. This is also checked on the server
    const dropOptions = groups
      .filter(grp => (grp.slug === "owner" && !hasOwnerAccess) ? false : true)
      .filter(grp => props.canInviteToGroup({ group: grp, user: Meteor.user() })) || [];

    if (dropOptions.length < 2) { return dropDownButton(); } // do not use dropdown if only one option

    return (
      <div className="group-dropdown">
        <Components.DropDownMenu
          buttonElement={dropDownButton(groups)}
          attachment="bottom right"
          targetAttachment="top right"
          onChange={handleUserGroupChange({ account, ownerGrpId: ownerGroup._id, onMethodDone, onMethodLoad })}
        >
          {dropOptions
            .filter(grp => grp._id !== group._id)
            .map((grp, index) => (
              <Components.MenuItem
                key={index}
                label={_.startCase(grp.name)}
                selectLabel={_.startCase(grp.name)}
                value={grp._id}
              />
            ))}
        </Components.DropDownMenu>
      </div>
    );
  }

  if (columnName === "button") {
    if (group.slug === "owner") {
      return null;
    }
    return (
      <div className="group-table-button">
        <Components.Button
          status="danger"
          onClick={handleRemoveUserFromGroup(account, group._id)}
          bezelStyle="solid"
          i18nKeyLabel="admin.groups.remove"
          label="Remove"
        />
      </div>
    );
  }

  return null;
};

GroupsTableCell.propTypes = {
  account: PropTypes.object,
  adminGroups: PropTypes.array, // all admin groups
  canInviteToGroup: PropTypes.func,
  columnName: PropTypes.string,
  group: PropTypes.object, // current group in interation
  handleRemoveUserFromGroup: PropTypes.func,
  handleUserGroupChange: PropTypes.func,
  onMethodDone: PropTypes.func,
  onMethodLoad: PropTypes.func
};

registerComponent("GroupsTableCell", GroupsTableCell);

export default GroupsTableCell;
