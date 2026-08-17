---
layout: post
title: Introducing libvirtualhid and Virtual HID Driver
subtitle: A simpler, more capable input system for Sunshine
cover-img: https://app.lizardbyte.dev/libvirtualhid/assets/img/banners/libvirtualhid.jpeg
thumbnail-img: https://app.lizardbyte.dev/libvirtualhid/assets/img/banners/libvirtualhid.jpeg
share-img: https://app.lizardbyte.dev/libvirtualhid/assets/img/banners/libvirtualhid.jpeg
gh-repo: LizardByte/libvirtualhid
gh-badge: [follow, star]
readtime: true
tags: [announcements, Sunshine, libvirtualhid, virtual-input]
comments: true
authors:
  - github: ReenigneArcher
---

Virtual input is the part of Sunshine that turns controls received from Moonlight into button presses, mouse movement,
touch input, and other actions on the host. It is mostly invisible when it works well, but it affects nearly every
streaming session.

Starting with [Sunshine](https://github.com/LizardByte/Sunshine) v2026.816.192458 (beta), that work is powered by
[libvirtualhid](https://github.com/LizardByte/libvirtualhid) v2026.816.1824.2. This first release of
libvirtualhid gives Sunshine one shared home for virtual input instead of maintaining a different implementation for
each operating system.

It also introduces [Virtual HID Driver](https://app.lizardbyte.dev/libvirtualhid/virtual-hid-driver), a new Windows
gamepad option with support for more controller types and features. Because using this Windows driver requires a paid
license, we want to explain exactly what is changing and what choices remain available.

## What are libvirtualhid and Virtual HID Driver?

[libvirtualhid](https://app.lizardbyte.dev/libvirtualhid/) is a free, open-source library for creating virtual input
devices. Sunshine uses it for supported gamepads, keyboards, mice, touchscreens, trackpads, and pen input. Other
projects can use the library too; it is not tied exclusively to Sunshine.

[Virtual HID Driver](https://app.lizardbyte.dev/libvirtualhid/virtual-hid-driver) is the Windows component used to
create virtual gamepads. It runs in user mode and avoids adding a custom kernel-mode driver to the system. The driver
is installed separately from Sunshine.

Sunshine remains licensed under GPLv3 and libvirtualhid is licensed under the MIT License. The Windows driver source
and package use the LizardByte Source-Available License.

## What changes in Sunshine?

Previously, Sunshine relied primarily on ViGEmBus for Windows gamepads, inputtino for Linux input, and separate code
for several other kinds of virtual input. Sunshine now uses libvirtualhid as the primary path for all supported
virtual input—not only gamepad input. ViGEmBus remains the Windows compatibility fallback described below.

Bringing this work together provides several benefits:

- Windows gains support for Generic, Xbox One, Xbox Series, DualShock 4, DualSense, and Nintendo Switch Pro-style
  virtual gamepads. Xbox 360 remains available through the ViGEmBus fallback.
- Linux supports the full controller selection, including Xbox 360, through its normal Linux input system.
- Features such as motion, touchpads, LEDs, adaptive triggers, battery information, and rumble can be passed between
  Moonlight and the virtual controller when the selected controller and game support them.
- Input fixes and new features can be developed once and shared across operating systems instead of being recreated
  in several different parts of Sunshine.
- The Windows driver is actively maintained alongside Sunshine, giving us a path to add profiles and improve
  compatibility over time.

## Windows licensing and pricing

The paid license applies only to creating gamepads through Virtual HID Driver on Windows. No Virtual HID Driver
license is needed for streaming, Windows keyboard or mouse input, using libvirtualhid on other platforms, Linux,
macOS, or the ViGEmBus fallback.

Both Windows license options provide the same features:

- **Yearly:** **$14.99 per year**, billed as a recurring subscription.
- **Lifetime:** **$49.99 once**, with no recurring subscription.

One license can be activated on up to **five machines**. Machines can be deactivated through the customer portal when
hardware is replaced. The license does not add its own limit to the number of active virtual gamepads, although
Sunshine's normal controller limits still apply. Taxes, where applicable, are calculated during checkout.

An internet connection is required when Virtual HID Driver creates a new gamepad so the machine license can be
checked. Sunshine shows the current status and provides activation, purchase, and account-management options on the
Troubleshooting page and in the **Virtual HID Driver** system tray menu.

[View the Windows license options](https://buy.polar.sh/polar_cl_zj6Io5NVukXfZSl97ULtFvImfI5L1jbL2cSnc0Y72Pt){: .btn .btn-primary }

Contributors to LizardByte projects through GitHub, Crowdin, or another avenue are welcome to
[request a free Virtual HID Driver license](https://forms.gle/kpStfesC1qG6FXu18). Each request is reviewed
individually, so submitting the form does not guarantee approval, but we appreciate everyone who takes the time to
contribute.

Anyone who has supported LizardByte projects through GitHub Sponsors, Patreon, or PayPal is also welcome to
[request a Virtual HID Driver discount code](https://forms.gle/h2yjpWhxpg1BrXhS8). Discount requests are reviewed
individually and cannot be guaranteed, but we sincerely appreciate every sponsor's support.

This is the first paid feature offered alongside Sunshine. The license helps cover the ongoing work involved in
signing, testing, distributing, supporting, and improving the Windows driver. Revenue from it will also help fund
continued development of Sunshine, libvirtualhid, and other LizardByte software. We have kept the license requirement
focused on the Windows gamepad driver rather than applying it to the shared library as a whole.

## ViGEmBus remains a no-cost option

Windows users can continue using ViGEmBus without purchasing a Virtual HID Driver license. When Virtual HID Driver is
not available, Sunshine automatically detects ViGEmBus 1.17 or newer and uses it for **Xbox 360** and **DualShock 4**
virtual controllers.

ViGEmBus does not provide the additional Xbox One, Xbox Series, DualSense, Nintendo Switch Pro-style, or Generic
profiles offered through Virtual HID Driver. The ViGEmBus repository was archived on November 2, 2023, and the
project's official [end-of-life announcement](https://docs.nefarius.at/projects/ViGEm/End-of-Life/) explains that
ViGEmBus and its client libraries will receive no further updates. Sunshine is retaining this fallback so Windows
users who do not want to purchase a Virtual HID Driver license can continue using Xbox 360 or DualShock 4 emulation.

## Linux stays free and requires no license key

On Linux, libvirtualhid replaces inputtino inside Sunshine. This is an internal change: **there is no paid Linux
driver and no license key is required**. Sunshine packages continue to configure the normal Linux input permissions,
and users receive the new shared input system as part of Sunshine.

Moving Linux to libvirtualhid gives it the same controller selection and shared input improvements without bringing
the Windows driver license along with it. It also restores Sunshine's legacy X11/XTest keyboard and mouse fallback.
On X11 systems where the normal Linux virtual-input device is unavailable, Sunshine can still use XTest for basic
keyboard and mouse input.

## macOS gamepad support is planned

Sunshine already uses libvirtualhid for the input types currently supported on macOS, including keyboard and mouse
input. Virtual gamepads are not supported on macOS yet, but adding them is planned future work. Keeping the macOS
implementation behind the same library gives us a clear place to add that support without creating another separate
Sunshine input system.

## Choosing the Windows gamepad option

Windows users have two paths in Sunshine:

1. Install [Virtual HID Driver](https://github.com/LizardByte/libvirtualhid/releases/latest), purchase a yearly or
   lifetime license, and activate the machine through Sunshine for the expanded controller selection and features.
2. Keep or install [ViGEmBus 1.17 or newer](https://github.com/nefarius/ViGEmBus/releases/latest) and use the Xbox 360
   or DualShock 4 fallback without a Virtual HID Driver license.

Sunshine reports which option is available and links to driver installation and license management when needed.

With libvirtualhid, virtual input now has one shared foundation across Sunshine. That gives us room to support more
controllers, bring improvements to multiple operating systems, and add macOS gamepads in the future. Windows users
who do not want to purchase a Virtual HID Driver license can continue using the ViGEmBus fallback, and Linux remains
license-free.

Learn more on the [libvirtualhid project site](https://app.lizardbyte.dev/libvirtualhid/), visit the
[Virtual HID Driver page](https://app.lizardbyte.dev/libvirtualhid/virtual-hid-driver), or follow development in the
[libvirtualhid repository](https://github.com/LizardByte/libvirtualhid).
