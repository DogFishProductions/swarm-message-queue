# swarm-message-queue
[![js-standard-style][standard-badge]][standard-style]
An investigation into Docker Swarm using a message queue cluster.

### Pre-requisites
#### Mac OS (El Capitan)
brew install pkg-config
brew install zmq

### Configure environment
npm config set swarm-message-queue:node_env local

### To update the Docker version on the PIs:

sudo apt-get remove docker-engine docker-compose docker-machine
sudo apt-get autoremove
curl -sSL get.docker.com | sh

sudo apt-get -y install python-pip
sudo pip install docker-compose

sudo apt-get install docker-machine

If there are problems with docker-engine like "Cannot connect to the Docker daemon. Is the docker daemon running on this host?":

$ sudo service docker status
● docker.service - Docker Application Container Engine
   Loaded: loaded (/etc/systemd/system/docker.service; enabled)
   Active: failed (Result: start-limit) since Thu 2016-08-18 14:35:57 UTC; 14min ago
     Docs: https://docs.docker.com
  Process: 1114 ExecStart=/usr/bin/docker daemon --storage-driver overlay --host fd:// --debug --host tcp://192.168.200.1:2375 --cluster-advertise 192.168.200.1:2375 --cluster-store consul://192.168.200.1:8500 --label hypriot.arch=armv7l --label hypriot.hierarchy=follower (code=exited, status=1/FAILURE)
 Main PID: 1114 (code=exited, status=1/FAILURE)

 Then 'vi /etc/systemd/system/docker.service' and replace the ip address with that shown in the router for this host.

$ sudo systemctl daemon-reload
$ sudo service docker start
$ sudo service docker status

Fixed! Job done.

[standard-badge]: https://raw.githubusercontent.com/feross/standard/master/badge.png
[standard-style]: https://github.com/feross/standard
