---
layout: post
title: Introducing LizardByte's Cloudsmith repositories
subtitle: An easier way to install and update Sunshine on Linux
cover-img: /assets/img/banners/cloudsmith-banner.png
thumbnail-img: /assets/img/banners/cloudsmith.png
share-img: /assets/img/banners/cloudsmith.png
gh-repo: LizardByte/Sunshine
gh-badge: [follow, star]
readtime: true
tags: [announcements, cloudsmith, linux, Sunshine]
comments: true
authors:
  - github: ReenigneArcher

debian_repositories:
  - name: Stable
    content: |
      ```bash
      curl -1sLf 'https://dl.cloudsmith.io/public/lizardbyte/stable/cfg/setup/bash.deb.sh' | sudo -E bash
      ```
  - name: Beta
    content: |
      ```bash
      curl -1sLf 'https://dl.cloudsmith.io/public/lizardbyte/beta/cfg/setup/bash.deb.sh' | sudo -E bash
      ```

rpm_repositories:
  - name: Stable
    content: |
      ```bash
      curl -1sLf 'https://dl.cloudsmith.io/public/lizardbyte/stable/cfg/setup/bash.rpm.sh' | sudo -E bash
      ```
  - name: Beta
    content: |
      ```bash
      curl -1sLf 'https://dl.cloudsmith.io/public/lizardbyte/beta/cfg/setup/bash.rpm.sh' | sudo -E bash
      ```

rpm_installers:
  - name: Fedora
    content: |
      ```bash
      sudo dnf install Sunshine
      ```
  - name: openSUSE
    content: |
      ```bash
      sudo zypper install Sunshine
      ```
---

Installing and updating [Sunshine](https://github.com/LizardByte/Sunshine) on Linux is getting easier. LizardByte now
has two public [Cloudsmith](https://cloudsmith.io/~lizardbyte/repos/) repositories for our DEB and RPM packages:

- The [stable repository](https://cloudsmith.io/~lizardbyte/repos/stable/) contains packages for official releases and
  is the best choice for most users.
- The [beta repository](https://cloudsmith.io/~lizardbyte/repos/beta/) contains packages for prereleases, making it a
  convenient way to try upcoming changes.

We are starting with Sunshine packages. Once a repository is configured, Sunshine can be installed and updated with
the same package manager used for the rest of your system. Cloudsmith's setup script detects your supported Debian,
Ubuntu, Fedora, or openSUSE release automatically.

## Getting started with Sunshine

Choose either the stable or beta repository below. You only need to configure one of them.

### Debian and Ubuntu

{% include tabs.html tabs=page.debian_repositories %}

After configuring the repository, install Sunshine:

```bash
sudo apt update
sudo apt install sunshine
```

### Fedora and openSUSE

{% include tabs.html tabs=page.rpm_repositories %}

After configuring the repository, install Sunshine with your distribution's package manager:

{% include tabs.html tabs=page.rpm_installers %}

Package availability depends on the distributions and releases currently supported by both Sunshine and Cloudsmith.
See the [Sunshine installation documentation][sunshine-install] for the latest details.

## GitHub release downloads are staying

Cloudsmith is an additional installation option, not a replacement for GitHub releases. If you prefer to download a
DEB or RPM directly, those packages will remain available from the
[Sunshine releases page](https://github.com/LizardByte/Sunshine/releases), along with Sunshine's other release files.

## An easier publishing option for developers

Developers who publish their own DEB or RPM packages can use the reusable
[LizardByte Cloudsmith Upload action](https://github.com/LizardByte/actions/tree/master/actions/cloudsmith_upload). It
uses Cloudsmith's official tooling, recognizes the distribution and release from common package filenames, checks
Cloudsmith's current distribution support, and can publish packages from a GitHub Actions workflow. The action is
public and reusable outside LizardByte projects too.

## Thank you, Cloudsmith

We would also like to thank Cloudsmith for including LizardByte in its
[open-source hosting program](https://docs.cloudsmith.com/resources/open-source-hosting-policy). Package repository
hosting is graciously provided by [Cloudsmith](https://cloudsmith.com), whose fully hosted, cloud-native, universal
package management service makes it possible for us to store and share packages with confidence.

We hope the new repositories make Sunshine installation and updates feel more familiar on Linux, while keeping the
manual download options that users already rely on.

[sunshine-install]: https://docs.lizardbyte.dev/projects/sunshine/latest/md_docs_2getting__started.html#linux
