import React, { Component } from "react";
import PropTypes from "prop-types";
import Measure from "react-measure";
import update from "immutability-helper";
import { compose } from "recompose";
import { composeWithTracker } from "@reactioncommerce/reaction-components";
import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { Reaction } from "/client/api";
import { Media } from "/imports/plugins/core/files/client";

const wrapComponent = (Comp) => (
  class ProductMediaGallery extends Component {
    static propTypes = {
      editable: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
      id: PropTypes.string,
      media: PropTypes.arrayOf(PropTypes.object),
      placement: PropTypes.string,
      productId: PropTypes.string,
      shopId: PropTypes.string,
      variantId: PropTypes.string
    }

    // Load first image as featuredImage
    constructor(props) {
      super(props);

      this.state = {
        dimensions: {
          width: -1,
          height: -1
        },
        featuredMedia: null,
        media: null
      };
    }

    static getDerivedStateFromProps(props) {
      return {
        media: props.media
      };
    }

    handleSetMediaPriority = (media, priority) => {
      Meteor.call("media/updatePriority", media._id, priority, (error) => {
        if (error) {
          // Go back to using media prop instead of media state so that it doesn't appear successful
          this.setState({ media: this.props.media });

          Alerts.toast(error.reason, "warning", {
            autoHide: 10000
          });
        }
      });
    }

    get media() {
      return this.state.media;
    }

    handleMouseEnterMedia = (event, media) => {
      const { editable } = this.props;

      // It is confusing for an admin to know what the actual featured media is if it
      // changes on hover of the other media.
      if (!editable) {
        this.setState({ featuredMedia: media });
      }
    };

    handleMouseLeaveMedia = () => {
      const { editable } = this.props;

      // It is confusing for an admin to know what the actual featured media is if it
      // changes on hover of the other media.
      if (!editable) {
        this.setState({ featuredMedia: null });
      }
    };

    handleMoveMedia = (dragIndex, hoverIndex) => {
      const mediaList = this.media;
      const media = mediaList[dragIndex];

      // Apply new sort order to variant list
      const newMediaOrder = update(mediaList, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, media]
        ]
      });

      // Set local state so the component doesn't have to wait for a round-trip
      // to the server to get the updated list of variants
      this.setState({ media: newMediaOrder });

      // Save the updated positions
      const sortedMediaIDs = newMediaOrder.map(({ _id }) => _id);
      Meteor.call("media/updatePriorities", sortedMediaIDs, (error) => {
        if (error) {
          // Go back to using media prop instead of media state so that it doesn't appear successful
          this.setState({ media: this.props.media });

          Alerts.toast(error.reason, "warning", {
            autoHide: 10000
          });
        }
      });
    };

    render() {
      const { width, height } = this.state.dimensions;

      return (
        <Measure
          bounds
          onResize={(contentRect) => {
            this.setState({ dimensions: contentRect.bounds });
          }}
        >
          {({ measureRef }) =>
            <div ref={measureRef}>
              <Comp
                featuredMedia={this.state.featuredMedia}
                onMouseEnterMedia={this.handleMouseEnterMedia}
                onMouseLeaveMedia={this.handleMouseLeaveMedia}
                onMoveMedia={this.handleMoveMedia}
                onSetMediaPriority={this.handleSetMediaPriority}
                {...this.props}
                media={this.media}
                mediaGalleryHeight={height}
                mediaGalleryWidth={width}
              />
            </div>
          }
        </Measure>
      );
    }
  }
);

/**
 * resort the media in
 * @param {Array<Object>} media media to sort by priority
 * @returns {Array<Object>} sorted media
 */
function sortMedia(media) {
  const sortedMedia = _.sortBy(media, (med) => {
    const { priority } = (med && med.metadata) || {};
    if (!priority && priority !== 0) {
      return 1000;
    }
    return priority;
  });
  return sortedMedia;
}

/**
 * @private
 * @param {Object} props Props
 * @param {Function} onData Call this to update props
 * @returns {undefined}
 */
function composer(props, onData) {
  const { productId, variantId } = props;

  let selector = {
    "metadata.variantId": {
      $in: [variantId]
    }
  };

  // Find images for the top-level product that aren't assigned to
  // a specific variant
  if (productId && !variantId) {
    selector = {
      $and: [
        {
          "metadata.productId": {
            $in: [productId]
          }
        },
        {
          "metadata.variantId": null
        }
      ]
    };
  }

  const media = Media.findLocal(selector, {
    sort: {
      "metadata.priority": 1
    }
  });

  onData(null, {
    editable: Reaction.hasPermission(props.permission || ["createProduct", "product/admin", "product/update"]),
    media: sortMedia(media),
    shopId: Reaction.getShopId(),
    productId,
    variantId
  });
}

export default compose(
  composeWithTracker(composer),
  wrapComponent
);
