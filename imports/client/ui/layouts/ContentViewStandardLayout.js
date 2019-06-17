import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import withStyles from "@material-ui/core/styles/withStyles";

const styles = (theme) => ({
  root: {
    width: "100vw",
    flexGrow: 1,
    transition: "padding 225ms cubic-bezier(0, 0, 0.2, 1) 0ms"
  },
  content: {
    maxWidth: 1140,
    paddingTop: theme.mixins.toolbar.minHeight + (theme.spacing.unit * 2),
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    margin: "0 auto"
  },
  leftSidebarOpen: {
    paddingLeft: theme.spacing.drawerWidth
  }
});

const ContentViewStandardLayout = ({ children, classes, isSidebarOpen }) => (
  <div
    className={
      classNames(classes.root, {
        [classes.leftSidebarOpen]: isSidebarOpen
      })
    }
  >
    <div className={classes.content}>
      {children}
    </div>
  </div>
);

ContentViewStandardLayout.propTypes = {
  children: PropTypes.node,
  classes: PropTypes.object,
  isMobile: PropTypes.bool,
  isSidebarOpen: PropTypes.bool
};

export default withStyles(styles, { name: "RuiContentViewStandardLayout" })(ContentViewStandardLayout);
