#!/bin/ash

# If we run source ~/.profile it will be looking for this file on the host and won't find it!!
# That's why we're using a shell script - it uses the correct scope (i.e. the container).
# We're running this script so that npm can find the directories we need to overcome install permission issues.
source ~/.profile
npm install
if [ $1 = "production" ]; then
  echo "we're in production"
  NODE_ENV=$1 node --harmony $2 $3
else 
  if [ $1 = "test" ]; then
    echo "running tests"
    NODE_ENV=$1 npm run gulp -- test
  else
    echo "we're in $1"
    NODE_ENV=$1 nodemon --ignore '*.test.js' --harmony $2 $3
  fi
fi
