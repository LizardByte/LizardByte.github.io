---
layout: post
title: Autostart Sunshine on Boot without Auto-Login
gh-repo: LizardByte/LizardByte.github.io
gh-badge: [follow, star]
tags: [community-guide, community-guide-sunshine, linux, sunshine]
comments: true
authors:
  - github: MidwesternRodent

editor-tabs:
  - name: 'nano'
    content:
      - |
        ```bash
        sudo nano /etc/ssh/sshd_config
        ```
      - |
        ```bash
        sudo nano /usr/local/bin/autossh-sunshine-start
        ```
      - |
        ```bash
        sudo nano /etc/systemd/system/autossh-sunshine.service
        ```
      - |
        ```bash
        sudo nano /usr/lib/systemd/user/sunshine-after-login.service
        ```
      - |
        ```bash
        sudo nano /etc/polkit-1/rules.d/sunshine.rules
        ```
      - |
        ```bash
        sudo nano /usr/share/sddm/scripts/Xsetup
        ```
  - name: 'vim'
    content:
      - |
        ```bash
        sudo vi /etc/ssh/sshd_config
        ```
      - |
        ```bash
        sudo vi /usr/local/bin/autossh-sunshine-start
        ```
      - |
        ```bash
        sudo vi /etc/systemd/system/autossh-sunshine.service
        ```
      - |
        ```bash
        sudo vi /usr/lib/systemd/user/sunshine-after-login.service
        ```
      - |
        ```bash
        sudo vi /etc/polkit-1/rules.d/sunshine.rules
        ```
      - |
        ```bash
        sudo vi /usr/share/sddm/scripts/Xsetup
        ```
---

{% capture headless_ssh_guide %}
  {% post_url /guides-community/2023-09-14-remote-ssh-headless-sunshine-setup %}
{% endcapture %}

After following this guide you will be able to:
1. Turn on the Sunshine host via Moonlight's Wake on LAN (WoL) feature.
2. Have Sunshine initialize to the login screen ready for you to enter your credentials.
3. Login to your desktop session remotely, and have your pipewire audio and Sunshine tray icon work appropriately.

## Specifications
This guide was created with the following software on the host:
1. OpenSSH server and client (both on the host machine)
2. Sunshine v2024.1003.1754422
3. Debian 12 w/ KDE Plasma, SDDM, Wayland (also tested through xorg), and pipewire for audio.

The host hardware that was used in developing this guide:
1. AMD 7900XTX
2. AMD Ryzen 7 7800X3D
3. 128GB DDR5 RAM
4. 4 displays in total. 2 1080p displays, 1 3440x1440 display, and 1 4k Roku TV which is used as the always-on display
for streaming. (could be subbed with a dummy plug).

If you have used this guide on any alternative hardware or software (including non-debian based distros)
please, feel free to modify this guide and keep it growing!

## Caveats
1. When you login the machine will close your connection and you will have to reconnect. This is necessary due to an
issue similar to why the
[Uinput Permissions Workaround]({{ headless_ssh_guide }}#uinput-permissions-workaround)
is needed since SSH connections are not treated the same as graphical logins. This causes weirdness like sound not
working through pipewire, and the tray icon for Sunshine not appearing. To get around this, we need to close the SSH
initiated Sunshine service, and start a new Sunshine service with the permissions of the graphical desktop.
Unfortunately, this closes the connection and forces you to reconnect through Moonlight. There is no way around this to
the best of my knowledge without enabling auto-login.
2. This guide does not cover using virtual displays. If you are using Nvidia graphics,
see [Remote SSH Headless Setup]({{ headless_ssh_guide }}).
If you are using AMD hardware, let me know if you find something or feel free to add it to this guide.
3. I haven't (yet) found a way to disable sleep on the login screen, so if you wait too long after starting your PC,
the display may go to sleep and Moonlight will have trouble connecting. Shutting down and using WoL works great
though.

{% include admonition.html type="attention" body="
This is definitely safer than enabling auto-login directly, especially for a dual-use PC that is not only
streamed via Moonlight, but is also used as a standard desktop. *However*, I do not know the implications of having an
always running SSH client to the localhost on the same machine. It may be possible for someone with significant
knowledge and physical access to the machine to compromise your user account due to this always-running SSH session.
However, that's better than just having the desktop always available, or opening up SSH even just your LAN since this
guide specifically disables non-localhost connections, so I believe this is safer to use than auto-login for general
users. As always, your [threat model](https://en.wikipedia.org/wiki/Threat_model) may vary.
" %}

## Prerequisites
In [Remote SSH Headless Setup]({{ headless_ssh_guide }})
complete the following sections.

1. [Static IP Setup]({{ headless_ssh_guide }}#static-ip-setup)
2. [SSH Server Setup]({{ headless_ssh_guide }}#ssh-server-setup)
3. [Virtual Display Setup]({{ headless_ssh_guide }}#virtual-display-setup)
4. [Uinput Permissions Workaround]({{ headless_ssh_guide }}#uinput-permissions-workaround)
5. [Stream Launcher Script]({{ headless_ssh_guide }}#stream-launcher-script)

{% include admonition.html type="note" body="
On a default Debian 12 install using KDE Plasma, you are using the Simple Desktop Display Manager (SDDM).
Even if you are logging in to a Wayland session, SDDM by default starts with an xorg session, so this script
does not need to be modified if you primarily use a Wayland session (the default) when you login.
" %}

## Instructions

### Enable Wake on LAN

Wake on LAN (WoL) will allow you to send a magic packet to turn your PC on remotely. This is handled automatically by
Moonlight's "send wake on lan" option in the app, but you do need to enable it on your host machine first. The
[instructions on the debian.org](https://wiki.debian.org/WakeOnLan#Enabling_WOL) site are a little hard to parse, so
I've simplified them below.

{% include admonition.html type="note" body="
This may not work on all deb based distributions. If you know of a better way for POP OS, Ubuntu, or another
debian based distro please feel free to edit the guide yourself, or let me know.
" %}

First, find the name of your ethernet interface.

```bash
ip link show
```

When I run this command, these are the results I receive
```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
   link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: enp117s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
   link/ether 9c:6b:00:59:33:c1 brd ff:ff:ff:ff:ff:ff
```

We can ignore the loopback interface, and I can see my ethernet interface is called `enp117s0`. You might see
wireless interfaces here as well, but they can also be ignored.

{% include admonition.html type="note" body="
If your PC is only connected via Wi-Fi, it is still technically possible to get this working, but it is outside
the scope of this guide and requires more networking knowledge and a Wi-Fi chip that supports WoL. If this is your
first foray into linux, I'd recommend just getting a cable.
" %}

Now I can install ethtool and modify my interface to allow Wake on LAN. For your use, replace `enp117s0` with whatever
the name of your ethernet interface is from the command `ip link show`

```bash
sudo apt update
sudo apt install ethtool
sudo ethtool -s enp117s0 wol g
```

### SSH Client Setup
To start, we need to install an SSH client (which is different from the *server* in
[Remote SSH Headless Setup]({{ headless_ssh_guide }}))
on our machine if this not already done. Open a terminal and enter the following commands.

```bash
sudo apt update
sudo apt install openssh-client
```

Next we need to generate the keys we will use to connect to our SSH session. This is as simple as running the
following in a terminal:

```bash
ssh-keygen
```

and simply pressing enter through the default options. This will place a file called `id_rsa` and `id_rsa.pub`
in the hidden folder `~/.ssh/`. This is the default key used when this user initiates an SSH session.

Next, we'll copy that public key to the `~/.ssh/authorized_users` file. These are the public keys
allowed to access this machine over SSH, and will allow us to establish an SSH connection with this user
to the SSH server running on the localhost.

```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

{% include admonition.html type="tip" body="
If you also want any other machines (e.g. a laptop or Steam Deck) to connect to your machine remotely over ssh,
be sure to generate a pubkey on that machine and append it to the authorized_keys file like we did above.
" %}

#### SSH Server Modifications

We'll want to make a few modification to the SSH server on the Sunshine host, both for convenience and security.

Modify `/etc/ssh/sshd_config` with the following changes:

{% include tabs.html tabs=page.editor-tabs index=0 %}

Find the line with `PasswordAuthentication` and make sure it is set to `no` (removed the `#` if present).
Then find the line `PubkeyAuthentication` and make sure it is set to `yes` (remove the `#`if present).
When you're done you should have these two lines in your config somewhere.

```
PubkeyAuthentication yes
PasswordAuthentication no
```

{% include admonition.html type="tip" body="
Using publickey encryption for SSH connections significantly increases your protection against brute force
attacks, and protects you against a rogue machine pretending to be your SSH server and stealing your password.
" %}

The next step is optional, but if you do not plan on connecting to your computer remotely via ssh and only have
installed SSH for the purposes of using Sunshine, it's a good idea to disable listening for remote SSH connections.
Do this by changing the following lines near the top of your `sshd_config`:

```
#ListenAddress 0.0.0.0
#ListenAddress ::
```

To the following:

```
ListenAddress 127.0.0.1
ListenAddress ::1
```

This will only allow SSH connections coming from your computer itself.

{% include admonition.html type="tip" body="
On some distributions, the maintainers have added some files in `/etc/ssh/sshd_config.d/` which are pulled into
your `sshd_config`. These modifications can conflict with what we've just done. If you have any files in
`/etc/ssh/sshd_config.d/`, make sure they do not include any of the changes we've just made, or you will experience
problems. If they do, you can comment out those lines by placing a `#` at their beginning, or delete the files safely
if you don't plan to use SSH for anything other than Sunshine.
" %}

#### Quick Test and Accept Host Authenticity.

Next, let's reboot the machine and try to connect! Accept any warnings about the unidentified host at this time,
you'll never see those appear again unless something changes with your setup.

```bash
ssh $(whoami)@localhost
```

You should see a new login prompt for the machine you're already on, and when you type `exit` you should just see

```bash
logout
Connection to localhost closed.
```

### Run sunshine-setup on boot over SSH

Thanks to
[this comment from Gavin Haynes on Unix Stack exchange](https://unix.stackexchange.com/questions/669389/how-do-i-get-an-ssh-command-to-run-on-boot/669476#669476),
we can establish an SSH connection on boot to run the sunshine-setup script via a systemd service.

#### Disable default Sunshine services

These service files are sometimes overwritten when updating Sunshine with the .deb.
So we'll be making new ones and disabling the included service files for our purposes.

```
sudo sytstemctl disable sunshine
systemctl --user disable sunshine
```

{% include admonition.html type="note" body="
In order to disable the user service, you must be logged in to the graphical desktop environment and run the
command from a GUI terminal. You'll also likely need to approve a polkit request (a graphical popup that asks
for your password). Trying to disable the user service without being signed in to the graphical environment is a
recipe for pain, and is why `sudo` is not invoked on the second line in the command above.
" %}

#### Create the autossh-sunshine-start script

{% include tabs.html tabs=page.editor-tabs index=1 %}

Copy the below script to that location and replace `{USERNAME}` wherever it occurs with the username you created
the SSH public key for in the previous section.

```bash
#!/bin/bash
ssh -i /home/{USERNAME}/.ssh/id_rsa {USERNAME}@localhost
"/home/{USERNAME}/scripts/sunshine.sh"
```

{% assign admonition_body = "
This script uses the location of the script in
[Stream Launcher Script]({{ headless_ssh_guide }}#stream-launcher-script).
Please complete that section before continuing.
" %}
{% include admonition.html type="attention" body=admonition_body %}

Once you've created the script, be sure to make it executable by running:

```bash
sudo chmod +x /usr/local/bin/autossh-sunshine-start
```

#### Create the autossh systemd service file

{% include tabs.html tabs=page.editor-tabs index=2 %}

Copy and paste the below systemd file and save it to the location in the commands above.

```
[Unit]
Description=Start sunshine over an localhost SSH connection on boot
Requires=sshd.service
After=sshd.service

[Service]
ExecStartPre=/bin/sleep 5
ExecStart=/usr/local/bin/autossh-sunshine-start
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Make it executable, and enable the service when you're done.

```bash
sudo chmod +x /etc/systemd/system/autossh-sunshine.service
sudo systemctl start autossh-sunshine
sudo systemctl enable autossh-sunshine
```

This point is a good time for a sanity check, so restart your PC and try to sign in to your desktop via Moonlight.
You should be able to access the login screen, enter your credentials, and control the user session. At this point
you'll notice the reason for the next section as your audio will be non-functional and you won't see any tray icon
for Sunshine. If you don't care about audio (and maybe a couple other bugs you might encounter from time to time due
to the permissions difference between an SSH session and the desktop session), you can consider yourself finished at
this point!

{% include admonition.html type="note" body="
You might also notice some issues if you have multiple monitors setup (including the dummy plug), like the mouse
cursor not being on the right screen for you to login. We will address this in the last step of this guide. It requires
messing with some configs for SDDM.
" %}

### Getting the audio working

To get the audio (and tray icon, etc...) working we will create a systemd user service, that will start on a graphical
login, kill the autossh-sunshine system service, and start Sunshine just like the standard Sunshine service.
This service will also need to call the autossh-sunshine system service before it is stopped as the user service will
be killed when we log out of the graphical session, so we want to make sure we restart that SSH service so we don't
lose the ability to log back in if we need to.

{% include tabs.html tabs=page.editor-tabs index=3 %}

Once again, copy the below service file into your text editor at the location above.

```
[Unit]
Description=Start Sunshine with the permissions of the graphical desktop session
StartLimitIntervalSec=500
StartLimitBurst=5

[Service]
# Avoid starting Sunshine before the desktop is fully initialized.
ExecStartPre=/usr/bin/pkill sunshine
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/sunshine
ExecStopPost=/usr/bin/systemctl start autossh-sunshine

Restart=on-failure
RestartSec=5s

[Install]
WantedBy=xdg-desktop-autostart.target
```

Make it executable, and enable it.

```bash
sudo chmod +x /usr/lib/systemd/user/sunshine-after-login.service
systemctl --user enable sunshine-after-login
```

#### Polkit Rules for Sunshine User Service

Since this is being run with the permissions of the graphical session, we need to make a polkit modification to allow
it to call the system service autossh-sunshine when this user service is stopped, without prompting us for a password.

{% include tabs.html tabs=page.editor-tabs index=4 %}

Once again, copy the below to the .rules file in your text editor.

```js
polkit.addRule(function(action, subject) {
  if (action.id == "org.freedesktop.systemd1.manage-units" &&
    action.lookup("unit") == "autossh-sunshine.service")
  {
    return polkit.Result.YES;
  }
})
```

#### Modifications to sudoers.d files

Lastly, we need to make a few modifications to the sudoers file for our users. Replace `{USERNAME}` below with your
username. You will be prompted to select either vi or nano for your editor if you've not used this command before,
choose whichever you prefer.

```
sudo visudo /etc/sudoers.d/{USERNAME}
```

{% include admonition.html type="danger" body="
NEVER modify a file in `sudoers.d` directly. Always use the `visudo` command. This command checks your changes
before saving the file, and if the resulting changes would break sudo on your system, it will prompt you to fix
them. Modifying the file with nano or vim directly does not give you this sanity check and introduces the
possibility of losing sudo access to your machine. Tread carefully, and make a backup.
" %}

As always, copy and paste the below into your user's `sudoers.d` configuration. Replace `{USERNAME}` with your username,
and `{HOSTNAME}` with the name of your computer.

```
{USERNAME} {HOSTNAME} = (root) NOPASSWD: /home/{USERNAME}/scripts/sunshine-setup.sh
{USERNAME} {HOSTNAME} = (root) NOPASSWD: /bin/sunshine
{USERNAME} {HOSTNAME} = (root) NOPASSWD: /usr/bin/systemctl start autossh-sunshine
{USERNAME} {HOSTNAME} = (root) NOPASSWD: /usr/bin/systemctl --user start sunshine-after-login
# The below is optional, but will allow us to send trigger a shutdown with a sunshine prep command, if desired.
{USERNAME} {HOSTNAME} = (root) NOPASSWD: /usr/sbin/shutdown
```

Once again, restart your computer and do a quick test. Make sure you can connect to the PC to login and enter your
credentials. You should be booted out of the system, and then can reconnect a few seconds later to the logged-in
desktop session. You should see a tray icon for Sunshine, and the sound should be working (or you may need to manually
select the sunshine-sink at least the first time).

If you don't have multiple monitors, at this point you can consider yourself done!

### Configuring the login screen layout for multiple monitors

This is not Sunshine specific, but is a frequent problem I had setting up Sunshine and thought it pertinent to add to
the guide. If you are using multiple monitors (even a single monitor with a dummy plug may have this problem) you
might notice the streamed login screen has one or more of the following problems:

1. The text is way too small to see (caused by a too-high resolution)
2. The mouse cursor is off on some other screen (caused by not mirroring the displays)
3. There are multiple login screens overlapping each other (caused by differing resolutions, and trying to mirror
the display).

#### Log in to an X11 Session

This can be fixed, by modifying some scripts called by SDDM on boot. To start though, we need to make sure we're
logged into an x11 session, not Wayland or the terminal. As the Wayland session will give us incorrect information,
and the terminal will give us no information since no graphical environment exists. SDDM initially starts an x11
session to display the login screen so we need to use xorg commands to change the display configuration.

To do this, log out of your desktop session on the Sunshine host, and somewhere on the lower left of your screen
(depending on your SDDM theme) there will be some text that on Debian 12 KDE Plasma defaults to saying
`Session: Plasma (Wayland)`. Select this and choose `Plasma (X11)` from the drop-down menu and sign in.

#### Find your monitor identifiers.

Open a terminal and run:

```bash
xrandr | grep -w connected
```

This will require some more sleuthing on your part. Different PC hardware, and different monitors / connectors,
display the names differently. Some start at 0, some start 1. Some spell out "DisplayPort" some, say "DP". You will
need to modify all the commands from here on out based on the output of the above command. I will use the output I
receive below as the example for the rest of this guide.

```bash
DisplayPort-0 connected (normal left inverted right x axis y axis)
DisplayPort-1 connected (normal left inverted right x axis y axis)
DisplayPort-2 connected (normal left inverted right x axis y axis)
HDMI-A-0 connected primary 1920x1080+0+0 (normal left inverted right x axis y axis) 800mm x 450mm
```

{% include admonition.html type="note" body="
If I instead run this command on Wayland, I get the following useless output. Hence, the need to sign in to a
x11 session.

```bash
XWAYLAND0 connected 2592x1458+6031+0 (normal left inverted right x axis y axis) 600mm x 340mm
XWAYLAND1 connected 2592x1458+0+0 (normal left inverted right x axis y axis) 480mm x 270mm
XWAYLAND2 connected primary 3440x1440+2592+0 (normal left inverted right x axis y axis) 800mm x 330mm
XWAYLAND3 connected 2592x1458+0+0 (normal left inverted right x axis y axis) 1440mm x 810mm
```
" %}

From this, you can see that my monitors are named the following under a x11 session.

DisplayPort-0
DisplayPort-1
DisplayPort-2
HDMI-A-0

{% include admonition.html type="tip" body="
If you have a label maker, now would be a good time to unplug some cables, determine where they are on your
system, and label the outputs on your graphics card to ease changing your setup in the future.
" %}

In my setup, after moving some inputs I changed my system so that these cables correspond to the below monitors

| Display Name  | Monitor                     |
|---------------|-----------------------------|
| DisplayPort-0 | rightmost 1080p display     |
| DisplayPort-1 | leftmost 1080p display      |
| DisplayPort-2 | middle 3440x1440 display    |
| HDMI-A-0      | 4k Roku TV (and dummy plug) |

#### Modify the SDDM startup script

For my purposes, I would prefer to have the Roku TV (which doubles as my always-on dummy plug) to always display a
1080p screen on login (this can be changed automatically after login). And I would like to retain the ability to use
my leftmost monitor to login to my physical desktop, but I'd like to disable my primary and rightmost displays.

To do this, we need to modify the SDDM startup script to shut off DisplayPort-1 and DisplayPort-2, set HDMI-A-0 to
1080p and mirror it with DisplayPort-1.

{% include tabs.html tabs=page.editor-tabs index=5 %}

Which will open a script that looks like this. We will not be removing these lines.

```bash
#!/bin/sh
# Xsetup - run as root before the login dialog appears

if [ -e /sbin/prime-offload ]; then
  echo running NVIDIA Prime setup /sbin/prime-offload
  /sbin/prime-offload
fi
```

At the bottom of this Xsetup script though, we can add some xrandr commands

To shut a display off, we can use:  `xrandr --output {DISPLAYNAME} --off`.

To set a display as the primary and accept
it's automatic (usually the maximum, but not always especially on TVs where the default refresh rate may be lower)
resolution and refresh rate we can use: `xrandr --output {DISPLAYNAME} --auto --primary`.

To set a display to a specific resolution we can use: `xrandr --output {DISPLAYNAME} --mode {PIXELWIDTH}x{PIXELLENGTH}`.

And lastly, to mirror a display we can use: `xrandr --output {DISPLAYNAME} --same-as {ANOTHER-DISPLAY}`

So with my desire to mirror my TV and left displays, my Xsetup script now looks like this:

```bash
#!/bin/sh
# Xsetup - run as root before the login dialog appears

if [ -e /sbin/prime-offload ]; then
  echo running NVIDIA Prime setup /sbin/prime-offload
  /sbin/prime-offload
fi

xrandr --output DisplayPort-0 --off
xrandr --output DisplayPort-2 --off
xrandr --output DisplayPort-1 --auto --primary
xrandr --output HDMI-A-0 --mode 1920x1080
xrandr --output HDMI-A-0 --same-as DisplayPort-1
```

Save this file, reboot, and you should see your login screen now respects these settings. Make sure when you log
back in, you select a Wayland session (if that is your preferred session manager).

## Next Steps

Congratulations! You now have Sunshine starting on boot, you can login to your session remotely, you get all the
benefits of the graphical session permissions, and you can safely shut down your PC with the confidence you can
turn it back on when needed.

{% include admonition.html type="seealso" body="
As Eric Dong recommended, I'll also send you to automate changing your displays.
You can add multiple commands, to turn off, or configure as many displays as you'd like with the sunshine prep
commands. See
[Changing Resolution and Refresh Rate](https://docs.lizardbyte.dev/projects/sunshine/master/md_docs_2app__examples.html#changing-resolution-and-refresh-rate)
for more information and remember that the display names for your prep commands, may be different from what you
found for SDDM.
" %}
