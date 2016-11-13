#!/bin/bash

#
# builds a production meteor bundle
#
set -e

# Fix permissions warning in Meteor >=1.4.2.1
# https://github.com/meteor/meteor/issues/7959
export METEOR_ALLOW_SUPERUSER=true

cd $APP_SOURCE_DIR

# Customize packages
$BUILD_SCRIPTS_DIR/build-packages.sh

# Generate plugin import files
printf "\n[-] Running Reaction plugin loader...\n\n"
$BUILD_SCRIPTS_DIR/plugin-loader.sh

# Install app deps
printf "\n[-] Running npm install...\n\n"
meteor npm install

# build the production bundle
printf "\n[-] Building Meteor application...\n\n"
mkdir -p $APP_BUNDLE_DIR
meteor build --directory $APP_BUNDLE_DIR > /dev/null

# run npm install in bundle
printf "\n[-] Running npm install in server bundle...\n\n"
cd $APP_BUNDLE_DIR/bundle/programs/server/
meteor npm install --production

# put the entrypoint script in WORKDIR
mv $BUILD_SCRIPTS_DIR/entrypoint.sh $APP_BUNDLE_DIR/bundle/entrypoint.sh

# change ownership of the app to the node user
chown -R node:node $APP_BUNDLE_DIR
