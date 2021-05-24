'use strict'
const peer =require('./getpeer/peers');
const torrentParser = require('./source/torrent-parser');
const fs = require('fs');
const bencode = require('bencode');
const prompt= require('prompt-sync')({sigint: true});

//const path = prompt('Enter Absolute torrent file path: ');

const torrent = torrentParser.open('puppy.torrent');

peer.getPeers(torrent, peers => {
    console.log('list of peers: ', peers);
  });