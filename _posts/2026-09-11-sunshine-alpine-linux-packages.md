---
layout: post
title: Sunshine now has Alpine Linux packages
subtitle: Official APKs for x86_64 and aarch64
cover-img: https://app.lizardbyte.dev/dashboard/github/openGraphImages/Sunshine_624x312.png
thumbnail-img: https://app.lizardbyte.dev/dashboard/github/openGraphImages/Sunshine_624x312.png
share-img: https://app.lizardbyte.dev/dashboard/github/openGraphImages/Sunshine_624x312.png
gh-repo: LizardByte/Sunshine
gh-badge: [follow, star]
readtime: true
tags: [announcements, alpine, linux, Sunshine]
comments: true
authors:
  - github: ReenigneArcher
---

[Sunshine](https://github.com/LizardByte/Sunshine) now provides official Alpine Linux packages for both x86_64 and
aarch64. The packages are available today from LizardByte's
[beta Cloudsmith repository](https://cloudsmith.io/~lizardbyte/repos/beta/) and the
[Sunshine releases page](https://github.com/LizardByte/Sunshine/releases). When the next stable Sunshine release is
published, its Alpine packages will also be available from the
[stable Cloudsmith repository](https://cloudsmith.io/~lizardbyte/repos/stable/).

This gives Alpine users a package built for the distribution's musl-based environment, without needing to build
Sunshine from source or adapt a package intended for another Linux distribution.

## Install Sunshine on Alpine

During the beta period, download the current package from the
[beta Cloudsmith repository](https://cloudsmith.io/~lizardbyte/repos/beta/) or the main
[GitHub releases page](https://github.com/LizardByte/Sunshine/releases). Choose the APK that matches your Alpine
release and system architecture.

[Browse Cloudsmith beta packages](https://cloudsmith.io/~lizardbyte/repos/beta/){: .btn .btn-primary }
[Browse Sunshine releases](https://github.com/LizardByte/Sunshine/releases){: .btn .btn-primary }

After downloading the package for your system, install it as root:

```sh
apk add --allow-untrusted ./sunshine_{version}_alpine{distro-version}_{arch}.apk
```

Release APKs use a new signing key for each build. That key is not already trusted by your Alpine installation, so
the `--allow-untrusted` option is required when installing the downloaded file.

To upgrade, download the newer APK for your Alpine release and architecture and install it with the same command. To
uninstall Sunshine:

```sh
apk del sunshine
```

## Compatibility and limitations

The Alpine builds do not include CUDA or NVFBC capture. The other capture and encoding backends supported by the
system remain enabled.

For current installation details and package requirements, see the
[Sunshine documentation](https://docs.lizardbyte.dev/projects/sunshine/master/md_docs_2getting__started.html#alpine-linux).
