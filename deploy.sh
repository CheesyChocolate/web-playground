#!/bin/sh
set -e

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found"
    exit 1
fi

: "${REMOTE_USER:?REMOTE_USER is not set in .env}"
: "${REMOTE_HOST:?REMOTE_HOST is not set in .env}"
: "${REMOTE_PATH:?REMOTE_PATH is not set in .env}"
: "${LOCAL_DIR:=.}"

echo "--- Pulling latest changes ---"
git pull

echo "--- Pushing changes ---"
git push

echo "--- Deploying to ${REMOTE_HOST} ---"
rsync -vrPlu \
    --exclude='.git/' \
    --exclude='.env' \
    --exclude='deploy.sh' \
    "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "--- Deployment Complete ---"
