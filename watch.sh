#!/bin/bash
sass --watch css/style.scss:css/style.css --style=expanded --no-source-map &
tsc --watch --project js/tsconfig.json &
wait
