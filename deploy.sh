ENV=${1:-dev}
echo "Removing stack..."
DEPLOYMENT_NAMESPACE=beanz
docker stack rm $DEPLOYMENT_NAMESPACE
limit=15

echo "Waiting for stack to be removed..."
until [ -z "$(docker service ls --filter label=com.docker.stack.namespace=$DEPLOYMENT_NAMESPACE -q)" ] || [ "$limit" -lt 0 ]; do
  sleep 2
  limit="$((limit-1))"
done
limit=15;
until [ -z "$(docker network ls --filter label=com.docker.stack.namespace=$DEPLOYMENT_NAMESPACE -q)" ] || [ "$limit" -lt 0 ]; do
  sleep 2;
  limit="$((limit-1))";
done

token="$(cat ~/.npmrc | grep beanz)"
if [ "$1" = "dev" ]
then
  echo "Building development image ..."
  docker build . -f dev.Dockerfile -t scheduler:local --build-arg NPM_TOKEN="${token}"
  echo "Deploying local stack"
  docker stack deploy $DEPLOYMENT_NAMESPACE --compose-file docker-compose.yml --compose-file docker-compose.local.yml --resolve-image always
elif [ "$1" = "full" ]
then
  echo "Building development image ..."  
  docker build . -f dev.Dockerfile -t scheduler:local --build-arg NPM_TOKEN="${token}"
  echo "Deploying full stack"
  docker stack deploy $DEPLOYMENT_NAMESPACE --compose-file docker-compose.yml --compose-file docker-compose.full.yml --resolve-image always
else
  echo "Building production image ..."  
  docker build . -f Dockerfile -t scheduler:local --build-arg NPM_TOKEN="${token}"
  echo "Deploying local stack"
  docker stack deploy $DEPLOYMENT_NAMESPACE --compose-file docker-compose.yml --compose-file docker-compose.local.yml --resolve-image always
fi

docker service logs beanz_scheduler -f