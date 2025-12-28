#!/bin/sh
set -e

# Load .env file
if [ -f .env ]; then
    # Export variables, ignoring lines starting with #
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found"
    exit 1
fi

# Ensure mandatory variables are set
: "${REMOTE_USER:?REMOTE_USER is not set in .env}"
: "${REMOTE_HOST:?REMOTE_HOST is not set in .env}"
: "${REMOTE_PATH:?REMOTE_PATH is not set in .env}"
: "${LOCAL_DIR:=.}"

echo "--- Pulling latest changes ---"
git pull

echo "--- Pushing changes ---"
git push

# If you add a build step later (like zola or npm build), add it here
# echo "--- Building ---"
# zola build 

echo "--- Deploying to ${REMOTE_HOST} ---"
# Syncing files. 
# We exclude git metadata and the deployment config itself.
rsync -vrPlu \
    --exclude='.git/' \
    --exclude='.env' \
    --exclude='deploy.sh' \
    "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "--- Deployment Complete ---"

