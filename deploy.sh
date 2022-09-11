ENV=${1:-dev}
echo "Removing stack..."
DEPLOYMENT_NAMESPACE=beanz
SERVICE_NAME=scheduler
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

if [ "$2" = "fresh" ]
then
  echo "Waiting for volumes to be removed..."
  docker volume rm -f beanz_scheduler-mongodb-volume
  docker volume rm -f beanz_scheduler-redis-volume
  docker volume rm -f beanz_scheduler-node-modules-volume
  until [ -z "$(docker volume ls --filter name=^beanz_scheduler -q)" ]; do
    sleep 1
  done
fi

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


limit=15
while [ "$limit" -gt 0 ]
do
  echo "Configuring the MongoDB ReplicaSet...";
  mongoId=$(docker ps -aq -f name=scheduler-mongodb);
  text=$(docker exec $mongoId mongo --eval '''rsconf={_id:"rs0",members:[{_id:0,host:"scheduler-mongodb:27017",priority:1.0}]};rs.initiate(rsconf);rs.reconfig(rsconf,{force:true});rs.isMaster();''');
  if [[ $text == *"\"ismaster\" : true"* ]]; then
    echo "[DONE]: MongoDB Configured";
    break;
  else
    echo "[WARN]: Trying to Configure MongoDB";
  fi
  limit="$((limit-1))";
  sleep 2
done


docker service logs "$DEPLOYMENT_NAMESPACE"_"$SERVICE_NAME" -f