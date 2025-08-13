#!/usr/bin/env bash
set -e

# REQUIRED ENVIRONMENT VARIABLES (for subprojects)
github_workflow=$(echo "${GITHUB_WORKFLOW:-}" | tr -d "'")
site_artifact=$(echo "${SITE_ARTIFACT:-}" | tr -d "'")

# OPTIONAL ENVIRONMENT VARIABLES (for subprojects)
config_file=$(echo "${CONFIG_FILE:-_config.yml}" | tr -d "'")
extract_archive=$(echo "${EXTRACT_ARCHIVE:-}" | tr -d "'")
github_timeout="${GITHUB_TIMEOUT:-10}"
theme_ref="${THEME_REF:-master}"

# From ReadTheDocs
git_sha=${READTHEDOCS_GIT_COMMIT_HASH}
github_url=${READTHEDOCS_GIT_CLONE_URL}

if [[ ${github_url} == git@* ]]; then
  # SSH URL format: git@github.com:user/repo.git
  github_user=$(echo "${github_url}" | cut -d: -f2 | cut -d/ -f1)
  github_repo=$(echo "${github_url}" | cut -d/ -f2 | sed 's/\.git$//')
else
  # HTTPS URL format: https://github.com/user/repo
  github_user=$(echo "${github_url}" | cut -d/ -f4)
  github_repo=$(echo "${github_url}" | cut -d/ -f5 | sed 's/\.git$//')
fi

export PAGES_REPO_NWO="${github_user}/${github_repo}"

echo "git sha: ${git_sha}"
echo "github url: ${github_url}"
echo "github user: ${github_user}"
echo "github repo: ${github_repo}"

# set default directories
project_dir="."
theme_dir="."

# if not the theme project then we need to clone the theme with submodules
sub_project="false"
if [ "${READTHEDOCS_PROJECT}" != "lizardbyte-gh-pages-main" ]; then
  sub_project="true"
  echo "Building a subproject: ${READTHEDOCS_PROJECT}"
  echo "github workflow: ${github_workflow}"
  echo "site artifact: ${site_artifact}"
  echo "github timeout: ${github_timeout}"
  echo "extract archive: ${extract_archive}"
  echo "config file: ${config_file}"
  echo "theme ref: ${theme_ref}"

  start_time=$(date +%s)
  max_time=$((start_time + 60 * github_timeout))
  sleep_interval=10

  # fail if the workflow is not set
  if [ -z "${github_workflow}" ]; then
    echo "github_workflow is not set"
    exit 1
  fi

  # fail if the site artifact is not set
  if [ -z "${site_artifact}" ]; then
    echo "site_artifact is not set"
    exit 1
  fi

  project_dir="project"
  theme_dir="theme"

  mkdir -p "${project_dir}"

  git clone https://github.com/LizardByte/LizardByte.github.io.git "${theme_dir}"
  pushd "${theme_dir}"
  git checkout "${theme_ref}"
  git submodule update --init --recursive
  popd

  encoded_workflow="${github_workflow// /%20}"
  check_api_url="https://api.github.com/repos/${github_user}/${github_repo}/commits/${git_sha}/check-runs?check_name=${encoded_workflow}"
  echo "Check API URL: ${check_api_url}"

  # Wait for check runs to be available
  count=1
  while true; do
    current_time=$(date +%s)
    if [ "${current_time}" -gt ${max_time} ]; then
      echo "Timeout waiting for check runs"
      exit 1
    fi
    echo "Checking check runs: ${count}"

    response=$(curl -s -H "Accept: application/vnd.github.v3+json" "${check_api_url}")
    check_runs=$(echo "${response}" | jq -r '.check_runs')
    check_run_count=$(echo "${check_runs}" | jq -r 'length')

    echo "Check runs count: ${check_run_count}"

    if [ "${check_run_count}" -gt 0 ]; then
      check_run=$(echo "${check_runs}" | jq -r '.[0]')
      check_job_id=$(echo "${check_run}" | jq -r '.id')
      check_run_html_url=$(echo "${check_run}" | jq -r '.html_url')
      echo "Check job id: ${check_job_id}"
      echo "Check run URL: ${check_run_html_url}"
      break
    fi

    echo "Waiting for check runs to be available..."
    sleep ${sleep_interval}
    count=$((count + 1))
  done

  # get the run id from the html url
  # e.g. https://github.com/LizardByte/LizardByte.github.io/actions/runs/13687305039/job/38273540489
  check_run_id=$(echo "${check_run_html_url}" | cut -d/ -f8)
  echo "Check run id: ${check_run_id}"

  # wait for the check run to complete, cancelled, timed out, etc.
  check_run_api_url="https://api.github.com/repos/${github_user}/${github_repo}/actions/runs/${check_run_id}"
  echo "Check run API URL: ${check_run_api_url}"

  count=1
  while true; do
    current_time=$(date +%s)
    if [ "${current_time}" -gt ${max_time} ]; then
      echo "Timeout waiting for check runs"
      exit 1
    fi
    echo "Checking check run status: ${count}"

    check_run_response=$(curl -s -H "Accept: application/vnd.github.v3+json" "${check_run_api_url}")

    check_run_status=$(echo "${check_run_response}" | jq -r '.status')
    check_run_conclusion=$(echo "${check_run_response}" | jq -r '.conclusion')

    echo "Check run status: ${check_run_status}"
    if [ "${check_run_status}" == "completed" ]; then
      break
    fi

    echo "Waiting for check run to complete..."
    sleep ${sleep_interval}
    count=$((count + 1))
  done

  # if not successful then exit
  if [ "${check_run_conclusion}" != "success" ]; then
    echo "Check run did not complete successfully"
    exit 1
  fi

  # download the artifact using nightly.link
  artifact_url="https://nightly.link/${github_user}/${github_repo}/actions/runs/${check_run_id}/${site_artifact}"

  # download and extract the ZIP artifact
  curl -sL "${artifact_url}" -o "${project_dir}/artifact.zip"
  7z x "${project_dir}/artifact.zip" -o"${project_dir}"
  rm "${project_dir}/artifact.zip"

  # if there is a name provided for extract_artifact, then we will extract the nested archive
  if [ -n "${extract_archive}" ]; then
    pushd "${project_dir}"
    case "${extract_archive}" in
      *.tar.gz|*.tgz)
        tar -xzf "${extract_archive}" -C .
        ;;
      *.tar)
        tar -xf "${extract_archive}" -C .
        ;;
      *.zip)
        7z x "${extract_archive}" -o.
        ;;
      *)
        echo "Unsupported archive format"
        exit 1
        ;;
    esac
    rm -f "${extract_archive}"
    popd
  fi
fi

TMPDIR=$(pwd)/../tmp
mkdir -p "${TMPDIR}"

base_dirs=(
  "${theme_dir}/third-party/beautiful-jekyll"
  "${theme_dir}"
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
    if [ -e "${base_dir}/${target}" ]; then
      cp -rf "${base_dir}/${target}" "${TMPDIR}/"
    fi
  done
done

# copy project directory, they should only come from the project repo
cp -RTf "${project_dir}/" "${TMPDIR}/"

cd "${TMPDIR}"

gem install bundle
bundle install
echo "baseurl: ${READTHEDOCS_VERSION}" > _config_rtd.yml
echo "_config_rtd.yml:"
cat _config_rtd.yml
echo "_config_theme.yml:"
cat _config_theme.yml

config_files=_config_rtd.yml,_config_theme.yml
if [ -n "${config_file}" ] && [ -e "${config_file}" ]; then
  config_files="${config_files},${config_file}"
  echo "config file: ${config_file}"
  cat "${config_file}"
fi

bundle exec jekyll build \
  --future \
  --config "${config_files}" \
  --destination "${READTHEDOCS_OUTPUT}html"

# mimic gh-pages
if [ "${sub_project}" == "true" ]; then
  mkdir -p "${READTHEDOCS_OUTPUT}html/${github_repo}/assets"
  cp -RTf "${READTHEDOCS_OUTPUT}html/assets" "${READTHEDOCS_OUTPUT}html/${github_repo}/assets"
fi

echo "Build finished"
echo "Output directory: ${READTHEDOCS_OUTPUT}html"
echo "Listing output directory:"
ls -Ra "${READTHEDOCS_OUTPUT}"
