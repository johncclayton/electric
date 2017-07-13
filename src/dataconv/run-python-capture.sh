#!/usr/bin/env bash
set -x
curl -X PUT http://127.0.0.1:5000/charge/0/0
sleep 1
curl -X PUT http://127.0.0.1:5000/stop/0
sleep 1
curl -X PUT http://127.0.0.1:5000/logsave
echo "Done"
