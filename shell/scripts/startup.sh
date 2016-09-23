#!/bin/ash

# If we run source ~/.profile it will be looking for this file on the host and won't find it!!
# That's why we're using a shell script - it uses the correct scope (i.e. the container).
# We're running this script so that npm can find the directories we need to overcome install permission issues.
source ~/.profile
npm install
NODE_ENV=$1 nodemon --harmony $2 $3
