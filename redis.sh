#!/bin/bash
container_id="$(docker ps | grep "redis" -i | awk '{print $1}')"
if [ -z "$container_id" ]
    then 
        echo "Redis container is not running, exiting.."
        exit
    else
        docker exec -it $container_id sh
fi