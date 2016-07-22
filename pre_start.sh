#!/bin/bash -e

# Courtesy of Jess

# If gulp, typings do not exist, then install them
hash gulp 2>/dev/null || npm install -g gulp
hash typings 2>/dev/null || npm install -g typings
hash karma-cli 2>/dev/null || npm install -g karma-cli
hash webpack 2>/dev/null || npm install -g webpack

(cd src && typings install)