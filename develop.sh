#!/bin/bash
echo 16384 | sudo -u wa.kinnunt2 sudo tee /proc/sys/fs/inotify/max_user_watches
nvm use 12
yarn watch
