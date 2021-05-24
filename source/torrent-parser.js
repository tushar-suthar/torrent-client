'use strict';

const crypto = require('crypto');
const fs = require('fs');
const bencode = require('bencode');
const bignum = require('bignum');

module.exports.open = (filepath) => {
  return bencode.decode(fs.readFileSync(filepath));
};

module.exports.size = torrent => {
  const size = torrent.info.files ?
  torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
  torrent.info.length;
  
    return bignum.toBuffer(size, {size: 8});
};

module.exports.infoHash = torrent => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
};