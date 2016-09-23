---
post_title: 'Investigating Docker Swarm Part 1: Message Queue Cluster'
layout: post 
published: false
---
### Introduction
First, create a simple publisher and subscriber using ZeroMQ.  Publisher is watching for changes in a text file and sending message to subscriber when they occur.  Subscriber listens for messages and outputs a log message when it is notified of a change.
Run: `node --harmony watcher-pub.js target.txt` & in another terminal `node --harmony watcher-sub.js`

Next, dockerize these two services into separate containers.  In docker-compose, link subscriber to publisher container and use publisher service name in `subscriber.connect('tcp://publisher:5432')` to make publisher service reachable via TCP.  Publisher is listening for all connections.
Run: `docker-compose up publisher` followed by `docker-compose up subscriber` (done in this order rather than using `depends_on` because otherwise both services will try to `npm install` at the same time causing havoc - would perhaps be better with different directories but this is supposed to be a simple example so we'll use the least effort).