# swarm-message-queue
[![js-standard-style][standard-badge]][standard-style]
An investigation into Docker Swarm using a message queue cluster.

### Pre-requisites
#### Mac OS (El Capitan)
```bash
$ brew install pkg-config
$ brew install zmq
```

### Configure environment
```bash
$ npm config set swarm-message-queue:node_env local
```

### To update the Docker version on the PIs:
```bash
$ sudo apt-get remove docker-engine docker-compose docker-machine
$ sudo apt-get autoremove
$ curl -sSL get.docker.com | sh

$ sudo apt-get -y install python-pip
$ sudo pip install docker-compose

$ sudo apt-get install docker-machine
```

When trying to run docker-engine, got the following message:

```bash
Cannot connect to the Docker daemon. Is the docker daemon running on this host?
```

When trying to join a swarm, I kept getting the message:

```bash
Error response from daemon: --cluster-store and --cluster-advertise daemon configurations are incompatible with swarm mode
```

It turns out this is because of the settings in /etc/systemd/system/docker.service, as created by HypriotOS:

```bash
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network.target docker.socket
Requires=docker.socket

[Service]
Type=notify
# the default is not to use systemd for cgroups because the delegate issues still
# exists and systemd currently does not support the cgroup feature set required
# for containers run by docker
ExecStart=/usr/bin/docker daemon --storage-driver overlay --host fd:// --debug --host tcp://192.168.0.10:2375 --cluster-advertise 192.168.0.10:2375 --cluster-store consul://192.168.0.10:8500 --label hypriot.arch=armv7l --label hypriot.hierarchy=leader
MountFlags=slave
LimitNOFILE=1048576
LimitNPROC=1048576
LimitCORE=infinity
TimeoutStartSec=0
# set delegate yes so that systemd does not reset the cgroups of docker containers
Delegate=yes

[Install]
WantedBy=multi-user.target
```
The solutions was to update this file as follows:

```bash
[Unit]
Description=Docker Application Container Engine
Documentation=https://docs.docker.com
After=network.target docker.socket
Requires=docker.socket

[Service]
Type=notify
# the default is not to use systemd for cgroups because the delegate issues still
# exists and systemd currently does not support the cgroup feature set required
# for containers run by docker
ExecStart=/usr/bin/docker daemon -H fd:// --storage-driver overlay
MountFlags=slave
LimitNOFILE=1048576
LimitNPROC=1048576
LimitCORE=infinity
TimeoutStartSec=0
# set delegate yes so that systemd does not reset the cgroups of docker containers
Delegate=yes

[Install]
WantedBy=multi-user.target
```

Once that's done, reload the daemon and restart the service:

```sh
$ sudo systemctl daemon-reload
$ sudo service docker start
$ sudo service docker status
```
Fixed! Job done.

[standard-badge]: https://raw.githubusercontent.com/feross/standard/master/badge.png
[standard-style]: https://github.com/feross/standard


[standard-badge]: https://raw.githubusercontent.com/feross/standard/master/badge.png
[standard-style]: https://github.com/feross/standard
