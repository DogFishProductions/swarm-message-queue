#!/bin/ash

# If we run source ~/.profile it will be looking for this file on the host and won't find it!!
# That's why we're using a shell script - it uses the correct scope (i.e. the container).
# We're running this script so that npm can find the directories we need to overcome install permission issues.
source ~/.profile
npm install
if [ $1 = "production" ]; then
  echo "we're in production"
  cd ..
  echo "Hello Paul" > target.txt
  NODE_ENV=$1 NODE_PATH=$2 node --harmony $3 $4
else 
  if [ $1 = "test" ]; then
    echo "running tests"
    cd ..
    echo "Hello Paul" > target.txt
    NODE_ENV=$1 NODE_PATH=$2 npm run gulp -- test
  else
    echo "we're in $1"
    cd ..
    echo "Hello Paul" > target.txt
    NODE_ENV=$1 NODE_PATH=$2 nodemon --ignore '*.test.js' --harmony $3 $4
  fi
fi
