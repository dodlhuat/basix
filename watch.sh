#!/bin/bash
npx sass --watch css/style.scss:css/style.css --style=expanded --no-source-map &
npx tsc --watch &
wait
