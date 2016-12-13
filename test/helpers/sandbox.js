// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');

const SANDBOX_PATH = path.resolve(__dirname, '..', 'sandbox');
const sandbox = module.exports;

sandbox.PATH = SANDBOX_PATH;

sandbox.reset = function() {
  rimraf.sync(SANDBOX_PATH);
  mkdirp.sync(SANDBOX_PATH);

  // Remove any cached modules from SANDBOX
  for (var key in require.cache) {
    if (key.slice(0, SANDBOX_PATH.length) == SANDBOX_PATH)
      delete require.cache[key];
  }
};

sandbox.resolve = function(/* ...args */) {
  const args = Array.prototype.slice.call(arguments);
  args.unshift(SANDBOX_PATH);
  return path.resolve.apply(path, args);
};
