---
layout: post
title: Discord Call Cancellation in Sunshine on Windows
subtitle: Cancel Discord call audio with Voicemeeter (Standard)
gh-repo: LizardByte/LizardByte.github.io
gh-badge: [follow, star]
tags: [community-guide, community-guide-sunshine, windows, sunshine, discord]
comments: true
authors:
  - github: BeeLeDev
---

## Voicemeeter Configuration
1. Click "Hardware Out"
2. Set the physical device you receive audio to as your Hardware Out with MME
3. Turn on BUS A for the Virtual Input

## Windows Configuration
1. Open the sound settings
2. Set your default Playback as Voicemeeter Input

{% include admonition.html type="tip" body="
Run audio in the background to find the device that your Virtual Input is using
(Voicemeeter In #), you will see the bar to the right of the device have green bars
going up and down. This device will be referred to as Voicemeeter Input.
" %}

## Discord Configuration
1. Open the settings
2. Go to Voice & Video
3. Set your Output Device as the physical device you receive audio to

{% include admonition.html type="tip" body="It is usually the same device you set for Hardware Out in Voicemeeter." %}

## Sunshine Configuration
1. Go to Configuration
2. Go to the Audio/Video tab
3. Set Virtual Sink as Voicemeeter Input

{% include admonition.html type="note" body="This should be the device you set as default previously in Playback." %}
