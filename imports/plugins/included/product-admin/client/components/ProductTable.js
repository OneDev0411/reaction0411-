import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Components } from "@reactioncommerce/reaction-components";
import { Grid, Button, Card, CardHeader, CardContent, IconButton, Typography, makeStyles } from "@material-ui/core";
import CloseIcon from "mdi-material-ui/Close";
import ImportIcon from "mdi-material-ui/Download";
import Dropzone from "react-dropzone";
import { i18next } from "/client/api";
import { Session } from "meteor/session";
import Chip from "@reactioncommerce/catalyst/Chip";
import withCreateProduct from "../hocs/withCreateProduct";

const useStyles = makeStyles((theme) => ({
  leftIcon: {
    marginRight: theme.spacing(1)
  },
  helpText: {
    marginLeft: "20px",
    letterSpacing: "0.28px",
    fontWeight: theme.typography.fontWeightRegular
  },
  cardHeaderTitle: {
    letterSpacing: "0.3px"
  },
  cardContainer: {
    alignItems: "center"
  },
  dropzone: {
    display: "inline-block"
  }
}));

/**
 * ProductTable component
 * @param {Object} props Component props
 * @returns {Node} React node
 */
function ProductTable({ onCreateProduct }) {
  const [files, setFiles] = useState([]);

  const handleDrop = useCallback((accepted) => {
    if (accepted.length === 0) return;
    setFiles(accepted);
  });

  const handleDelete = useCallback((deletedFilename) => {
    const newFiles = files.filter((file) => file.name !== deletedFilename);
    setFiles(newFiles);
  });

  const importFiles = useCallback(() => {
    let productIds = [];

    files.map((file) => {
      const output = [];
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onloadend = () => {
        const parse = require("csv-parse");

        parse(reader.result, {
          trim: true,
          // eslint-disable-next-line camelcase
          skip_empty_lines: true
        })
          .on("readable", function () {
            let record;
            // eslint-disable-next-line no-cond-assign
            while (record = this.read()) {
              output.push(record);
            }
          })
          .on("end", () => {
            output.map((outputarray) => {
              productIds = productIds.concat(outputarray);
              return;
            });
            Session.set("filterByProductIds", productIds);
          });
      };
      return;
    });
  });

  const classes = useStyles();

  return (
    <Grid container spacing={3}>
      <Grid item sm={12}>
        <Card raised>
          <CardHeader
            className={classes.cardHeaderTitle}
            action={
              <IconButton aria-label="close">
                <CloseIcon />
              </IconButton>
            }
            title="Filter products by file"
          />
          <CardContent>
            { files.length > 0 ? (
              <Grid container spacing={1} className={classes.cardContainer}>
                <Grid item sm={12}>
                  {files.map((file) => <Chip label={file.name} onDelete={() => handleDelete(file.name)} />)}
                </Grid>
                <Grid item sm={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    style={{ float: "right" }}
                    onClick={importFiles}
                  >
                    Filter products
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={1} className={classes.cardContainer}>
                <Grid item sm={12}>
                  <Dropzone
                    className={classes.dropzone}
                    disableClick
                    multiple
                    disablePreview
                    onDrop={handleDrop}
                    ref={(inst) => { this.dropzone = inst; }}
                    accept="text/csv"
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        this.dropzone && this.dropzone.open();
                      }}
                    >
                      <ImportIcon className={classes.leftIcon}/>
                      Import
                    </Button>
                  </Dropzone>
                  <Typography variant="h5" display="inline" className={classes.helpText}>
                    Import a .csv file with a list of product IDs, separated by commas.
                  </Typography>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item sm={12}>
        <Button
          color="primary"
          onClick={onCreateProduct}
          variant="contained"
        >
          {i18next.t("admin.createProduct") || "Create product"}
        </Button>
      </Grid>
      <Grid item sm={12}>
        <Components.ProductsAdmin />
      </Grid>
    </Grid>
  );
}

ProductTable.propTypes = {
  onCreateProduct: PropTypes.func
};

export default withCreateProduct(ProductTable);
