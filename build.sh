token="$(cat ~/.npmrc | grep beanz)"
docker build . -f Dockerfile -t scheduler:local --build-arg NPM_TOKEN="${token}"