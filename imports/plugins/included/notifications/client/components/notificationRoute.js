import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Reaction } from "/client/api";


class NotificationRoute extends Component {
  constructor(props) {
    super(props);

    this.handleNoNotifications = this.handleNoNotifications.bind(this);
    this.renderDropdownHead = this.renderDropdownHead.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleNoNotifications(notifyArr) {
    if (notifyArr.length <= 0) {
      return (
        <li className="notification">
          <div className="media">
            <div className="media-body">
              <strong className="notification-title" data-i18n="notifications.body.noNotifcations">No notifications yet</strong>
            </div>
          </div>
        </li>
      );
    }
    return null;
  }

  handleClick(notify) {
    if (notify.type === "forAdmin") {
      const actionViewData = Reaction.Apps({
        name: "reaction-orders",
        provides: "dashboard"
      });
      Reaction.showActionView(actionViewData);
    } else {
      Reaction.Router.go(notify.url);
    }

    const { markOneAsRead } = this.props;
    return markOneAsRead(notify._id);
  }

  renderDropdownHead() {
    const { notificationList, unread, markAllAsRead } = this.props;
    return (
      <div className="dropdown-toolbar">
        <div className="dropdown-toolbar-actions">
          <a onClick={() => { markAllAsRead(notificationList); }} data-i18n="notifications.body.markAllAsRead"> Mark all as read</a>
        </div>
        <h3 className="dropdown-toolbar-title"><span data-i18n="notifications.body.recent">Recent</span> ({unread})</h3>
      </div>
    );
  }

  render() {
    const { notificationList } = this.props;
    return (
      <div className="notify-bar">
        { this.renderDropdownHead() }
        <ul className="dropdown-notify notifications">
          { this.handleNoNotifications(notificationList) }
          { notificationList.map((notify, key) => {
            const timeNow = moment(notify.timeSent).fromNow();
            const read = `notification ${notify.status}`;
            const i18n = `notifications.messages.${notify.type}`;
            return (
              <li className={read} key={key}>
                <a onClick={() => {
                  this.handleClick(notify);
                }}
                >
                  <div className="media">
                    <div className="media-body">
                      <strong className="notification-title" data-i18n={i18n}>{notify.message}</strong>
                      <div className="notification-meta">
                        <small className="timestamp">{timeNow}</small>
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

NotificationRoute.propTypes = {
  markAllAsRead: PropTypes.func,
  markOneAsRead: PropTypes.func,
  notificationList: PropTypes.array,
  unread: PropTypes.number
};

export default NotificationRoute;
