#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd -- "${script_dir}/.." && pwd -P)"
cd "${repo_root}"

platforms=(
  ruby
  x86_64-linux
  arm64-darwin
  x86_64-darwin
  x64-mingw-ucrt
  x64-mingw32
  x86-mingw32
)

update_with_local_bundler() {
  bundle lock --add-platform "${platforms[@]}"
}

ruby_image_from_dockerfile() {
  local line image

  while IFS= read -r line; do
    case "${line}" in
      FROM\ ruby:*)
        image="${line#FROM }"
        image="${image%% AS *}"
        image="${image%% as *}"
        printf '%s\n' "${image}"
        return 0
        ;;
      *)
        ;;
    esac
  done < "${repo_root}/Dockerfile"
}

update_with_docker() {
  local docker_repo_root="${repo_root}"
  local ruby_image="${BUNDLE_LOCK_RUBY_IMAGE:-}"

  if command -v cygpath >/dev/null 2>&1; then
    docker_repo_root="$(cygpath -w "${repo_root}")"
  fi

  if [[ -z "${ruby_image}" ]]; then
    ruby_image="$(ruby_image_from_dockerfile)"
  fi

  if [[ -z "${ruby_image}" ]]; then
    echo "Unable to determine the Ruby Docker image from Dockerfile." >&2
    exit 1
  fi

  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' docker run --rm \
    -v "${docker_repo_root}:/work" \
    -w /work \
    "${ruby_image}" \
    sh -lc 'bundle lock --add-platform "$@"' sh "${platforms[@]}"
}

if command -v docker >/dev/null 2>&1; then
  update_with_docker
elif command -v bundle >/dev/null 2>&1; then
  update_with_local_bundler
else
  echo "Unable to update Gemfile.lock: install Docker or Ruby Bundler first." >&2
  exit 1
fi

echo "Updated ${repo_root}/Gemfile.lock"
