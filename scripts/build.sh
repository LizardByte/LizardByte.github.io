#!/usr/bin/env bash

# if ./dist exists, remove it entirely
if [ -d "./dist" ]; then
  rm -rf ./dist
fi

# if ./gh-pages exists, remove the contents
if [ -d "./gh-pages" ]; then
  rm -rf ./gh-pages/*
fi

# copy ./src directory to ./dist
cp -r ./src ./dist

# install npm dependencies
npm install
npm run build

# copy ./dist directory to ./gh-pages
if [ -d "./gh-pages" ]; then
  mv -f ./dist/* ./gh-pages/
fi
