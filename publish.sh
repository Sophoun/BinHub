#!/bin/bash

# Configuration
IMAGE_NAME="sophoun/binhub"
VERSION="latest"

# Build the image
echo "Building Docker image ${IMAGE_NAME}:${VERSION}..."
docker build -t "${IMAGE_NAME}:${VERSION}" .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
else
    echo "Build failed!"
    exit 1
fi

# Push the image to Docker Hub
echo "Pushing image to Docker Hub..."
docker push "${IMAGE_NAME}:${VERSION}"

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "Successfully published to Docker Hub: ${IMAGE_NAME}:${VERSION}"
else
    echo "Failed to push to Docker Hub. Make sure you are logged in using 'docker login'."
    exit 1
fi
