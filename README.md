# Overview

[![Build](https://img.shields.io/github/actions/workflow/status/lizardbyte/LizardByte.github.io/ci.yml.svg?branch=master&label=build&logo=github&style=for-the-badge)](https://github.com/LizardByte/LizardByte.github.io/actions/workflows/ci.yml?query=branch%3Amaster)

## About

This repo contains the source files for the [LizardByte](https://app.lizardbyte.dev) website.

The page is built using jekyll and hosted on GitHub Pages.

### CrowdIn Localization

[![CrowdIn graph](https://app.lizardbyte.dev/dashboard/crowdin/LizardByte_graph.svg)](https://translate.lizardbyte.dev)

### Reusable Workflow

This repo contains a reusable workflow to allow for building gh-pages subprojects using the same configuration.

```yml
---
name: Jekyll CI

on:
 pull_request:
   branches:
     - master
   types:
     - opened
     - synchronize
     - reopened

concurrency:
 group: "${{ github.workflow }}-${{ github.ref }}"
 cancel-in-progress: true

jobs:
  prep:
    runs-on: ubuntu-latest
    steps:
      # Prepare your site here if needed, you can run any build steps needed to generate the site
      # The structure of the artifacts must be exactly as you expect to find the files in the final site
      # e.g. `index.html` should be at the root of the artifact, not in a subdirectory
      - name: Sample build
        run: echo "Hello, world!" > hello.txt

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: prep  # any name except 'site' is allowed
          path: hello.txt
          if-no-files-found: error
          include-hidden-files: true
          retention-days: 1
  
  call-jekyll-build:
    needs: prep
    uses: LizardByte/LizardByte.github.io/.github/workflows/jekyll-build.yml@master
    with:
      site_artifact: 'prep'  # any name except 'site' is allowed
      target_branch: 'gh-pages'
      clean_gh_pages: true
    secrets:
      GH_BOT_EMAIL: ${{ secrets.GH_BOT_EMAIL }}
      GH_BOT_NAME: ${{ secrets.GH_BOT_NAME }}
      GH_BOT_TOKEN: ${{ secrets.GH_BOT_TOKEN }}
```

For additional options see [jekyll-build.yml](.github/workflows/jekyll-build.yml)
