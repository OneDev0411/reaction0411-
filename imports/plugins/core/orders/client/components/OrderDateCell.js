import React, { Fragment } from "react";
import PropTypes from "prop-types";
import moment from "moment";

/**
 * @name OrderDateCell
 * @param {Object} row A react-table row object
 * @return {React.Component} A date component
 */
export default function OrderDateCell({ row }) {
  if (!moment) return null;

  // Determine what date or time to display.
  const now = moment();
  const orderCreatedAt = moment(row.values.createdAt);
  const duration = moment.duration(now.diff(orderCreatedAt));
  const durationHours = duration.asHours();

  let dateTimeFormat = "MM-DD HH:mm A";
  // Show year for orders placed outside the current year.
  if (orderCreatedAt.year() !== now.year()) {
    dateTimeFormat = "YYYY-MM-DD HH:mm A";
  }

  // Render order date by default
  let dateOrTime = moment(orderCreatedAt).format(dateTimeFormat);
  if (durationHours < 1) {
    dateOrTime = `${Math.round(duration.asMinutes())} minutes ago`;
  }

  if (durationHours > 1 && durationHours < 8) {
    dateOrTime = `${Math.round(durationHours)} hours ago`;
  }

  return (
    <Fragment>
      {dateOrTime}
    </Fragment>
  );
}

OrderDateCell.propTypes = {
  row: PropTypes.object.isRequired
};
