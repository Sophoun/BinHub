# Configuration
$IMAGE_NAME = "Sophoun/BinHub"
$VERSION = "latest"

# Build the image
Write-Host "Building Docker image ${IMAGE_NAME}:${VERSION}..." -ForegroundColor Cyan
docker build -t "${IMAGE_NAME}:${VERSION}" .

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Push the image to Docker Hub
Write-Host "Pushing image to Docker Hub..." -ForegroundColor Cyan
docker push "${IMAGE_NAME}:${VERSION}"

# Check if push was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully published to Docker Hub: ${IMAGE_NAME}:${VERSION}" -ForegroundColor Green
} else {
    Write-Host "Failed to push to Docker Hub. Make sure you are logged in using 'docker login'." -ForegroundColor Red
    exit $LASTEXITCODE
}
