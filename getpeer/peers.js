'use strict'
const util = require('../source/util');
const dgram = require('dgram');
const file  = require('fs');
const ben   = require('bencode');
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const socket =dgram.createSocket('udp4');
const crypto = require('crypto');


//module to get list of peers
module.exports.getpeers= (torrent,callback) =>{
  
    const url = torrent.announce.toString('utf8');
    udpSend(socket, buildConnReq(), url);


    socket.on('message', response => {
        if (respType(response) === 'connect') {

          const connResp = parseConnResp(response);

          const announceReq = buildAnnounceReq(connResp.connectionId,torrent);

          udpSend(socket, announceReq, url);

        } else if (respType(response) === 'announce') {
          const announceResp = parseAnnounceResp(response);
          callback(announceResp.peers);
        }
    });
};


function udpSend(socket, message, rawUrl, callback=()=>{}) {
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.host, callback);
  }
  
  function respType(resp) {
    const action = resp.readUInt32BE(0);
    if (action === 0) return 'connect';
    if (action === 1) return 'announce';
  }
  
  function buildConnReq() {
    const buf=Buffer.alloc(16);
    //setting connection id with 32+32=64 bit integer
    buf.writeUInt32BE(0x417,0);
    buf.writeUInt32BE(0x27101980,4);

    //0 for connection action with offset 8
    buf.writeUInt32BE(0,8);

    //random no for transition id with offset 12
    crypto.randomBytes(4).copy(buf, 12);

    return buf;
  }
  
  function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
      }
  }
  
  function buildAnnounceReq(connId, torrent, port=6888) {
    const buf =Buffer.alloc(98);
    
    //connection id
    connId.copy(buf, 0);

    //action which is 1 for announcement
    buf.writeUInt32BE(1, 8);

    //transactionId
    crypto.randomBytes(4).copy(buf, 12);

    // info hash
    torrentParser.infoHash(torrent).copy(buf, 16);

    //id generation by util
    util.genId().copy(buf, 36);

    // downloaded default 0 value for all
    Buffer.alloc(8).copy(buf, 56);

    // left
    torrentParser.size(torrent).copy(buf, 64);

    // uploaded
    Buffer.alloc(8).copy(buf, 72);
    
    // event => 0: none; 1: completed; 2: started; 3: stopped
    buf.writeUInt32BE(0, 80);
    
    // ip address
    buf.writeUInt32BE(0, 80);
    
    // key
    crypto.randomBytes(4).copy(buf, 88);
    
    // num want can be negative
    buf.writeInt32BE(-1, 92);
    
    // port
    buf.writeUInt16BE(port, 96);

    return buf;
  }
  
  function parseAnnounceResp(resp) {
    function group(iterable, groupSize) {
        let groups = [];
        for (let i = 0; i < iterable.length; i += groupSize) {
          groups.push(iterable.slice(i, i + groupSize));
        }
        return groups;
      }
    
      return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: group(resp.slice(20), 6).map(address => {
          return {
            ip: address.slice(0, 4).join('.'),
            port: address.readUInt16BE(4)
          }
        })
      }
  }