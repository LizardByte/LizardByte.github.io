FROM ruby:4.0-bookworm AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /theme

COPY . .

# Create site
RUN <<_SITE
#!/bin/bash
set -e

TMPDIR=/tmp/site

base_dirs=(
  ./third-party/beautiful-jekyll
  ./
)

targets=(
  *.gemspec
  _data
  _includes
  _layouts
  _sass
  assets
  404.html
  _config_theme.yml
  favicon.ico
  feed.xml
  Gemfile
  staticman.yml
  tags.html
)

for base_dir in "${base_dirs[@]}"; do
  for target in "${targets[@]}"; do
    if [ -e "$base_dir/$target" ]; then
      cp -rf "$base_dir/$target" ${TMPDIR}/
    fi
  done
done

cp -RTf ./ ${TMPDIR}/

_SITE

FROM base AS build

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
COPY --from=base /tmp/site .

# Install the gems specified in the Gemfile
RUN <<_SETUP
#!/bin/bash
set -e

bundle install
_SETUP

# Expose the port that Jekyll will run on
EXPOSE 4000

# Command to build and serve the Jekyll site
CMD ["bundle", "exec", "jekyll", "serve", "--future", "--trace", "--config", "_config_theme.yml,_config_local.yml"]
