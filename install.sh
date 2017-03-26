#!/usr/bin/env bash
echo "Building Docker image..."
docker build -t webifier-test-ice-shield .
echo "Done building. Removing intermediate containers..."
docker rm $(docker ps -a -q)
echo "Removed Containers. Removing images..."
docker rmi $(docker images -q -f dangling=true)
echo "Removed images."
