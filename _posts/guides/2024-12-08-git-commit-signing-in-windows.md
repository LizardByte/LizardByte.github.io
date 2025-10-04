---
layout: post
title: Signing Git Commits in Windows
subtitle: How to sign your Git commits in Windows using GPG and Kleopatra
gh-repo: LizardByte/LizardByte.github.io
gh-badge: [follow, star]
readtime: true
tags: [dev, git, github, guide, windows]
comments: true
authors:
  - github: ReenigneArcher
---

## Introduction
Have you ever wanted to sign your Git commits, and get the fancy `Verified` badge on your commits in GitHub?
This post will show you how to sign your Git commits in Windows using GPG and Kleopatra.

## Prerequisites
1. Download and install [Gpg4win](https://www.gpg4win.org/), ensuring that Kleopatra option is selected.

## Create new OpenPGP certificate
1. Open Kleopatra and select "New Key Pair"

   ![New Key Pair](/assets/img/posts/2024-12-08-git-commit-signing-in-windows/new-key-pair.png)

2. Enter your GitHub username and email. The email must be one you have assigned to your GitHub account.
   You can find your no-reply email https://github.com/settings/emails on this page if you have one set.
3. Optionally, expand "Advanced Options" and change the "Key Material" option. I used "rsa4096".
   You can also change or disable the expiration date.
4. Select "OK".

## Configure git
1. Open terminal (cmd.exe or PowerShell) and run the following command.

   ```bash
   gpg --list-secret-keys --keyid-format LONG
   ```

2. Copy the key id. `1234567890ABCDEF` is the id in the example below.

   ```
   sec   rsa4096/1234567890ABCDEF 2024-12-08 [SC]
         ABCDEF1234567890ABCDEFGH1234567890ABCDEF
   uid                 [ultimate] GitHub-Username <GitHub-Email-Address>
   ssb   rsa4096/0987654321FEDCBA 2024-12-08 [E]
   ```

3. Run the following command to configure git to use the key.

   ```bash
   git config --global user.signingkey <KEY-ID>
   ```

4. If git cannot find gpg you may need to add the path to the gpg executable to your git configuration.
   You can find the path to gpg by running the following command.

   ```bash
   where gpg
   ```

   Then add the path to your git configuration.

   ```bash
   git config --global gpg.program "C:\Program Files (x86)\GnuPG\bin\gpg.exe"
   ```

5. Run the following command to enable commit signing.

   ```bash
   git config --global commit.gpgsign true
   ```

## Configure GitHub
1. Right-click the key in Kleopatra, select "Details", then "Export". Select all the contents and copy them.
2. Go to your GitHub account settings, and select "SSH and GPG keys".
3. Click "New GPG key". Give the key a title, and paste the contents of the public key into the key field.
4. Click "Add GPG key".

## Automatically start Kleopatra
1. Open the Windows Task Scheduler.
2. Optionally, create a new folder for the task.
3. Select the folder, and then click "Create Task".
4. Enter a name for the task, such as "Open Kleopatra".
5. Select "Run only when user is logged on".
6. Click the "Triggers" tab, then "New".
7. Select "At log on" from the "Begin the task" dropdown.
8. Select "Specific user", and click "OK".
9. Click the "Actions" tab, then "New".
10. Click "Browse", and select the Kleopatra executable.
    The default location is `"C:\Program Files (x86)\Gpg4win\bin\kleopatra.exe"`
11. In the "Start in" field, enter `%HOMEDRIVE%%HOMEPATH%`, and click "OK".
12. On the "Conditions" tab, uncheck everything.
13. On the settings tab, ensure the following options are set.

    - Allow task to be run on demand (checked)
    - Run task as soon as possible after a scheduled start is missed (checked)
    - If the task fails, restart every 1 minute (checked)
    - Attempt to restart up to 3 times
    - Stop the task if it runs longer than (unchecked)
    - If the running task does not end when requested, force it to stop (checked)
    - If the task is not scheduled to run again, delete it after (unchecked)
    - If the task is already running, then the following rule applies (Do not start a new instance)

14. Click "OK".

## Revoking a Key
In some cases you may need to revoke a key. To do this follow the steps below.

1. Open Kleopatra, right-click on the key, and select "Revoke Certificate".
2. Select the reason for revoking the key, and click "Revoke Certificate".
3. Right-click the key again, select "Details", then "Export". Select all the contents and copy them.
4. Go to your GitHub account settings, and select "SSH and GPG keys".
5. Remove the old key, and click "New GPG key". Give the key a title (such as "Revoked Key"),
   and paste the contents of the public key into the key field.

Alternatively, this can be done via command line.
See [How to actually revoke a GitHub GPG key](https://github.com/orgs/community/discussions/108355#discussioncomment-8476035)

This approach will allow previously verified commits to remain verified.

## Caveats
- Commits made before your key was created cannot be verified, even if you amend the commits. This can be annoying if
  you have any WIP commits that you want to amend. A simple workaround for this is to start an interactive rebase,
  and edit each commit to adjust. Finally, when you amend the commit do so with the following command.

  ```bash
  git commit --amend --date=now --no-edit
  ```

## Conclusion
You should now be able to sign your Git commits in Windows using GPG and Kleopatra. I'd like to give credit to
Tom Auger for his [blog post](https://tau.gr/posts/2018-06-29-how-to-set-up-signing-commits-with-git/) which helped me
figure out how to do this initially.
