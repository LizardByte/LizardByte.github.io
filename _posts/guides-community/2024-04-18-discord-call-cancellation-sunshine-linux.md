---
layout: post
title: Discord Call Cancellation in Sunshine on Linux
gh-repo: LizardByte/LizardByte.github.io
gh-badge: [follow, star]
tags: [community-guide, community-guide-sunshine, linux, sunshine, discord]
comments: true
authors:
  - github: RickAndTired
---

1. Set your normal *Sound Output* volume to 100%

   ![](/assets/img/posts/2024-04-18-discord-call-cancellation-sunshine-linux/01.png)

2. Start Sunshine

3. Set *Sound Output* to *sink-sunshine-stereo* (if it isn't automatic)

   ![](/assets/img/posts/2024-04-18-discord-call-cancellation-sunshine-linux/02.png)

4. In Discord, right click *Deafen* and select your normal *Output Device*.
  This is also where you will need to adjust output volume for Discord calls

   ![](/assets/img/posts/2024-04-18-discord-call-cancellation-sunshine-linux/03.png)

5. Open *qpwgraph*

   ![](/assets/img/posts/2024-04-18-discord-call-cancellation-sunshine-linux/04.png)

6. Connect `sunshine [sunshine-record]` to your normal *Output Device*
   * Drag `monitor_FL` to `playback_FL`
   * Drag `monitor_FR` to `playback_FR`

   ![](/assets/img/posts/2024-04-18-discord-call-cancellation-sunshine-linux/05.png)
