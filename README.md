# Overview

[![Build](https://img.shields.io/github/actions/workflow/status/lizardbyte/LizardByte.github.io/ci.yml.svg?branch=master&label=build&logo=github&style=for-the-badge)](https://github.com/LizardByte/LizardByte.github.io/actions/workflows/ci.yml?query=branch%3Amaster)

## About

This repo contains the source files for the [LizardByte](https://app.lizardbyte.dev) website.

The page is built using jekyll and hosted on GitHub Pages.

### CrowdIn Localization

[![CrowdIn graph](https://app.lizardbyte.dev/dashboard/crowdin/LizardByte_graph.svg)](https://translate.lizardbyte.dev)

<p align="center">
  <a href="https://translate.lizardbyte.dev" aria-label="CrowdIn">
    <img src='https://raw.githubusercontent.com/LizardByte/contributors/refs/heads/dist/crowdin.606145.svg'/>
  </a>
</p>

### Reusable Workflow

This repo contains a reusable workflow to allow for building gh-pages subprojects using the same configuration.

```yml
---
name: Jekyll CI
permissions:
  contents: read

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
    secrets:
      GH_BOT_EMAIL: ${{ secrets.GH_BOT_EMAIL }}
      GH_BOT_NAME: ${{ secrets.GH_BOT_NAME }}
      GH_BOT_TOKEN: ${{ secrets.GH_BOT_TOKEN }}
    with:
      site_artifact: 'prep'  # any name except 'site' is allowed
      target_branch: 'gh-pages'
      clean_gh_pages: true
```

For additional options see [jekyll-build.yml](.github/workflows/jekyll-build.yml)

### PR Previews

Changes to gh-pages can be previewed, by setting up the project in ReadTheDocs.
It is recommended to use the following manual configuration:

Initial setup:
```yml
Name: LizardByte-gh-pages-<repo_name>  # the project slug cannot be changed after creation
Repository URL: https://github.com/LizardByte/<repo_name>.git
Default-branch: master
Language: English
```

Project Settings:
```yml
Connected-repository: https://github.com/LizardByte/<repo_name>.git
URL-versioning-scheme: Multiple versions without translations
Path-for-.readthedocs.yaml:  # only set if not in the root of the repo
Programming-Language: Other
Project-homepage: https://app.lizardbyte.dev/<repo_name>
Description: Preview PRs for gh-pages
Build-pull-requests-for-this-project: true
```

Environment Variables:
```yml
# REQUIRED
GITHUB_WORKFLOW: call-jekyll-build / Build Jekyll
SITE_ARTIFACT: prep.zip  # the name of the artifact to look for in the workflow

# OPTIONAL
CONFIG_FILE: _config.yml
EXTRACT_ARCHIVE: pre_built_database.zip  # if there is a nested archive to extract
GITHUB_TIMEOUT: 10  # timeout in minutes to use when searching for GitHub artifacts, max 15
THEME_REF: master
``` 

Additionally, do the following:

1. Deactivate the `stable` version
2. Make the `latest` version hidden
3. Add project as a subproject of `LizardByte-gh-pages-main`
4. Update branch protection rules in GitHub repo settings to require status checks from ReadTheDocs
5. Add the below `.readthedocs.yaml` file to the root of the repo, or a custom path as specified in the project settings

```yml
---
# Read the Docs configuration file
# See https://docs.readthedocs.io/en/stable/config-file/v2.html for details

version: 2

build:
  os: ubuntu-24.04
  tools:
    ruby: "3.3"
  apt_packages:
    - 7zip
    - jq
  jobs:
    install:
      - |
        mkdir -p "./tmp"
        branch="master"
        base_url="https://raw.githubusercontent.com/LizardByte/LizardByte.github.io"
        url="${base_url}/refs/heads/${branch}/scripts/readthedocs_build.sh"
        curl -sSL -o "./tmp/readthedocs_build.sh" "${url}"
        chmod +x "./tmp/readthedocs_build.sh"
    build:
      html:
        - "./tmp/readthedocs_build.sh"

```
