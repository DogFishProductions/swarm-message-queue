# Version: 0.0.2

FROM risingstack/alpine:3.4-v6.3.0-3.6.2

MAINTAINER Paul Nebel "paul@nebel.io"
ENV REFRESHED_AT 2016_07_23
LABEL name="Base dev image for zeromq"
LABEL version="1.1"

# Add the relevant packages so that we can 'npm install zmq'
RUN apk update -q &&\
    apk add --no-cache make gcc g++ python zeromq zeromq-dev &&\
    apk upgrade

# Create "dogfish" user
RUN addgroup appuser &&\
    adduser -G appuser -g "App User" -h /home/dogfish -s /bin/ash -D dogfish &&\
    chown -R dogfish:appuser /usr/local

# Set up some semblance of an environment
WORKDIR /home/dogfish
ENV HOME /home/dogfish
RUN mkdir /home/dogfish/app &&\
    mkdir /home/dogfish/.npm-global &&\
    chown -R dogfish:appuser /home/dogfish &&\
    echo "export PATH=~/.npm-global/bin:$PATH" >> /home/dogfish/.profile

USER dogfish

RUN npm config set prefix '~/.npm-global' &&\
    source /home/dogfish/.profile &&\
    npm install -g npm &&\
    npm cache clear

WORKDIR /home/dogfish/app
VOLUME /home/dogfish/app