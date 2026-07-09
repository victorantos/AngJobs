---
title: Installation
order: "02"
description: Install the single mkweb binary on macOS, Linux, or Windows, verify it, and keep it current.
prev: /docs/getting-started/
prevTitle: Getting started
next: /docs/configuration/
nextTitle: Configuration
example: true
---

mkweb ships as a single static binary — there is no runtime to install and nothing else to download. Pick whichever method suits you.

## Install script (macOS and Linux)

The quickest route. The script detects your platform, downloads the right binary, and places it in `~/.local/bin`:

```sh
curl -fsSL https://get.mkweb.example/install.sh | sh
```

Prefer to read before you run? Download the script first:

```sh
curl -fsSL https://get.mkweb.example/install.sh -o install.sh
less install.sh
sh install.sh
```

## Manual download (all platforms)

Grab the archive for your platform from the releases page, unpack it, and put the binary somewhere on your `PATH`:

| Platform        | Archive                    | Binary   |
| --------------- | -------------------------- | -------- |
| macOS (Apple)   | `mkweb-darwin-arm64.tar.gz`| `mkweb`  |
| macOS (Intel)   | `mkweb-darwin-amd64.tar.gz`| `mkweb`  |
| Linux (x86-64)  | `mkweb-linux-amd64.tar.gz` | `mkweb`  |
| Linux (ARM)     | `mkweb-linux-arm64.tar.gz` | `mkweb`  |
| Windows         | `mkweb-windows-amd64.zip`  | `mkweb.exe` |

On macOS and Linux, make it executable if your unarchiver didn't:

```sh
chmod +x mkweb
mv mkweb ~/.local/bin/
```

## Verify the install

```sh
mkweb version
```

You should see something like:

```
mkweb 2.4.1 (darwin/arm64)
```

If your shell says `command not found`, the binary isn't on your `PATH` — see [Troubleshooting](/docs/troubleshooting/).

> **Note** — Each release publishes a `checksums.txt`. Verifying is one line: `shasum -a 256 -c checksums.txt --ignore-missing`.

## Upgrading

mkweb can replace itself with the latest release:

```sh
mkweb upgrade
```

The command prints the old and new versions and does nothing else — your projects are never touched by an upgrade.
