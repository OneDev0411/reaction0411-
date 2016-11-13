import React, { Component, PropTypes } from "react";
import update from "react/lib/update";
import { composeWithTracker } from "react-komposer";
import { MediaGallery } from "../components";
import { Reaction } from "/client/api";
import { ReactionProduct } from "/lib/api";
import { Media, Revisions } from "/lib/collections";

function uploadHandler(files) {
  // TODO: It would be cool to move this logic to common ValidatedMethod, but
  // I can't find a way to do this, because of browser's `FileList` collection
  // and it `Blob`s which is our event.target.files.
  // There is a way to do this: http://stackoverflow.com/a/24003932. but it's too
  // tricky
  const productId = ReactionProduct.selectedProductId();
  const variant = ReactionProduct.selectedVariant();
  if (typeof variant !== "object") {
    return Alerts.add("Please, create new Variant first.", "danger", {
      autoHide: true
    });
  }
  const variantId = variant._id;
  const shopId = ReactionProduct.selectedProduct().shopId || Reaction.getShopId();
  const userId = Meteor.userId();
  let count = Media.find({
    "metadata.variantId": variantId
  }).count();
  // TODO: we need to mark the first variant images somehow for productGrid.
  // But how do we know that this is the first, not second or other variant?
  // Question is open. For now if product has more than 1 top variant, everyone
  // will have a chance to be displayed
  const toGrid = variant.ancestors.length === 1;

  for (const file of files) {
    const fileObj = new FS.File(file);

    fileObj.metadata = {
      ownerId: userId,
      productId: productId,
      variantId: variantId,
      shopId: shopId,
      priority: count,
      toGrid: +toGrid // we need number
    };

    Media.insert(fileObj);
    count++;
  }

  return true;
}

class MediaGalleryContainer extends Component {
  state = {
    featuredMedia: undefined
  }

  handleDrop = (files) => {
    uploadHandler(files);
  }

  handleRemoveMedia = (media) => {
    const imageUrl = media.url();
    const mediaId = media._id;

    Alerts.alert({
      title: "Remove Media?",
      type: "warning",
      showCancelButton: true,
      imageUrl,
      imageHeight: 150
    }, (isConfirm) => {
      if (isConfirm) {
        Media.remove({ _id: mediaId }, (error) => {
          if (error) {
            Alerts.toast(error.reason, "warning", {
              autoHide: 10000
            });
          }

          // updateImagePriorities();
        });
      }
      // show media as removed (since it will not disappear until changes are published
    });
  }

  get media() {
    return (this.state && this.state.media) || this.props.media;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      media: nextProps.media
    });
  }

  handleMouseEnterMedia = (event, media) => {
    this.setState({
      featuredMedia: media
    });
  }

  handleMouseLeaveMedia = () => {
    this.setState({
      featuredMedia: undefined
    });
  }

  handleMoveMedia = (dragIndex, hoverIndex) => {
    const media = this.props.media[dragIndex];

    // Apply new sort order to variant list
    const newMediaOrder = update(this.props.media, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, media]
      ]
    });

    // Set local state so the component does't have to wait for a round-trip
    // to the server to get the updated list of variants
    this.setState({
      media: newMediaOrder
    });

    // Save the updated positions
    Meteor.defer(() => {
      newMediaOrder.forEach((mediaItem, index) => {
        Media.update(mediaItem._id, {
          $set: {
            "metadata.priority": index
          }
        });
      });
    });
  }

  render() {
    return (
      <MediaGallery
        allowFeaturedMediaHover={this.props.editable === false}
        featuredMedia={this.state.featuredMedia}
        onDrop={this.handleDrop}
        onMouseEnterMedia={this.handleMouseEnterMedia}
        onMouseLeaveMedia={this.handleMouseLeaveMedia}
        onMoveMedia={this.handleMoveMedia}
        onRemoveMedia={this.handleRemoveMedia}
        {...this.props}
        media={this.media}
      />
    );
  }
}

function fetchMediaRevisions() {
  const productId = ReactionProduct.selectedProductId();
  const mediaRevisions = Revisions.find({
    parentDocument: productId,
    documentType: "image",
    "workflow.status": {
      $nin: ["revision/published"]
    }
  }).fetch();
  return mediaRevisions;
}

// resort the media in
function sortMedia(media) {
  const sortedMedia = _.sortBy(media, function(m) { return m.metadata.priority});
  return sortedMedia;
}

// Search through revisions and if we find one for the image, stick it on the object
function appendRevisionsToMedia(props, media) {
  if (!Reaction.hasPermission(props.permission || ["createProduct"])) {
    return media;
  }
  const mediaRevisions = fetchMediaRevisions();
  const newMedia = [];
  for (const image of media) {
    image.revision = undefined;
    for (const revision of mediaRevisions) {
      if (revision.documentId === image._id) {
        image.revision = revision;
        image.metadata.priority = revision.documentData.priority;
      }
    }
    newMedia.push(image);
  }
  return sortMedia(newMedia);
}

function composer(props, onData) {
  let media;
  let editable;
  const viewAs = Reaction.Router.getQueryParam("as");

  if (!props.media) {
    // Fetch media based on props
  } else {
    media = appendRevisionsToMedia(props, props.media);
  }

  if (viewAs === "customer") {
    editable = false;
  } else {
    editable = Reaction.hasPermission(props.permission || ["createProduct"]);
  }

  onData(null, {
    editable,
    media
  });
}

MediaGalleryContainer.propTypes = {
  editable: PropTypes.bool,
  id: PropTypes.string,
  media: PropTypes.arrayOf(PropTypes.object),
  placement: PropTypes.string
};

export default composeWithTracker(composer)(MediaGalleryContainer);
