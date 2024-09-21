FROM ruby:3.3-bookworm

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN <<_DEPS
#!/bin/bash
set -e

apt-get update -qq
apt-get install -y --no-install-recommends \
  build-essential
apt-get clean
rm -rf /var/lib/apt/lists/*
_DEPS

WORKDIR /app

COPY . .

# Install the gems specified in the Gemfile
RUN <<_SETUP
#!/bin/bash
set -e

bundle install
_SETUP

# Expose the port that Jekyll will run on
EXPOSE 4000

# Command to build and serve the Jekyll site
CMD ["bundle", "exec", "jekyll", "serve", "--trace", "--config", "_config.yml,_config_local.yml"]
