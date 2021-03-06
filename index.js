#!/usr/bin/env iojs --es_staging
"use strict";

const mkdirp = require('mkdirp');
const chk = require('chokidar');
const Q = require('q');
const fs = require('fs');
const Path = require('path');
const co = require('co');
const _ = require('lodash');

const SIZE_MAP = {
  '': 'mdpi',
  '@1x': 'mdpi',
  '@1.5x': 'hdpi',
  '@2x': 'xhdpi',
  '@3x': 'xxhdpi'
};

const IMAGE_REGEX = /[^\/a-z_0-9]*([A-Za-z_0-9]+?)[^\/a-z_0-9]*(xxxhdpi|xxhdpi|xhdpi|hdpi|mdpi|ldpi|@\d(?:\.\d)?x|)(\.png)$/;

let args = require('minimist')(process.argv.slice(2));
let src = ensurePrefix(args._[0] || './');
let dest = ensurePrefix(args._[1] || './');
let copyOnly = args['copy-only'];
// camel2snake option here also

let customSizeMap = args['custom-sizes'];
if (customSizeMap) {
  customSizeMap.split('|').forEach(function(size) {
    let map = size.split('=');
    SIZE_MAP[map[0]] = map[1];
  });
}

if (args['relative-dest']) {
  dest = mkpath(src, args['relative-dest']);
}

log('started watching', src, '->', dest);

let watcher = chk.watch(src, {ignored: /([\/\\]\.|\.idea|node_modules)/}).on('all', co.wrap(function *(event, path) {

  try {

    if (process.env.NODE_DEBUG) {
      log(event.toUpperCase() + ':', mkpath(Path.basename(Path.dirname(path)), Path.basename(path)));
    }

    let matches;
    if ('unlink' != event && (matches = path.match(IMAGE_REGEX))) {


      let filename = (args.camel2snake ? camel2snake(matches[1]) : matches[1]) + matches[3];
      let fileType = matches[2];
      //console.log(args.camel2snake, camel2snake(matches[1]), matches[1], filename, fileType, 'ddd');

      if (process.env.NODE_DEBUG) {
        log(matches);
      }

      let srcPath = getSourcePath(path);

      let destPath = yield getDrawablePath(fileType, filename);

      log((copyOnly ? 'copying' : 'moving'), srcPath, '->', destPath);

      yield move(srcPath, destPath);
      log(copyOnly ? 'copied' : 'moved');
    }

  } catch (e) {
    log(e);
  }


}));

fs.readdirSync(src).forEach(function(val) {
  watcher.emit('all', 'add', mkpath(src, val));
});


// util functions

function move(srcPath, destPath) {
  return co(function *() {
    try {
      return yield Q.nfcall(copyOnly ? copyFile : fs.rename, srcPath, destPath);
    } catch (e) {
      log(e);
      return false;
    }
  });
}

function copyFile(src, dest, cb) {
  cb = _.once(cb);
  fs.createReadStream(src).pipe(fs.createWriteStream(dest)).on('close', cb).on('error', cb);
}

function getSourcePath(filename) {
  return /^\//.test(filename) ? filename : mkpath(src, filename);
}

function getDrawablePath(type, filename) {
  return co(function *() {
    if ('string' !== typeof type) {
      return null;
    }

    if (SIZE_MAP[type]) {
      type = SIZE_MAP[type];
    }

    let drawableDir = mkpath(dest, 'drawable-' + type);

    if (!(yield createIfNotExists(drawableDir))) {
      log('could not create ' + drawableDir);
      return null;
    }

    return mkpath(drawableDir, filename);

  });
}

function createIfNotExists(path) {
  return co(function *() {
    if (!path || !path.trim()) {
      return false;
    }

    try {

      try {
        yield Q.nfcall(fs.access, path, fs.F_OK)

      } catch (e) {

        if ('ENOENT' != e.code) {
          return log(e);
        }

        log('creating', path);
        yield Q.nfcall(mkdirp, path);
      }

    } catch(e) {
      log(e);
      return false;
    }

    return true;

  });
}

function ensurePrefix(dir) {
  if (!dir) {
    return dir;
  }
  return /^\.?\//.test(dir) ? dir : './' + dir;
}

function mkpath(p1, p2) {
  return p1.replace(/\/$/, '') + '/' + p2.replace(/^\//, '');
}

function camel2snake(camelCase) {
  return camelCase.replace(/[A-Z]/g, function(match) {return '_' + match.toLowerCase();})
}

function log() {
  if (arguments[0] instanceof Error) {
    arguments[0] = arguments[0].message || arguments[0];
  }
  Array.prototype.unshift.call(arguments, '[ ' + src + ' ]:');
  console.log.apply(console, arguments);
}