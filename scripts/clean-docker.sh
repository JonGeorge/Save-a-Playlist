#!/bin/bash
docker container rm saveaplaylist-app-1 saveaplaylist-db-1 saveaplaylist-web-1
docker image rm saveaplaylist-app saveaplaylist-db nginx
docker volume rm saveaplaylist_db-volume
