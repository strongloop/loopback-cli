#!/usr/bin/env node
// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const assert = require('assert');
const camelCaseKeys = require('camelcase-keys');
const debug = require('debug')('loopback:cli');
const minimist = require('minimist');
const path = require('path');

const opts = minimist(process.argv.slice(2), {
  alias: {
    help: 'h',
    version: 'v',
    commands: 'l',
  },
});

if (opts.version) {
  const ourVersion = require('../package.json').version;
  const generatorVersion = require('generator-loopback/package.json').version;
  const workspaceVersion = require('generator-loopback').workspaceVersion;
  console.log('%s (generator-loopback@%s loopback-workspace@%s)',
    ourVersion, generatorVersion, workspaceVersion);
  return;
}

// Tell the generator to replace "yo loopback:" with "lb"
process.env.SLC_COMMAND = 'loopback-cli';

// NOTE(bajtos) Loading generator-loopback takes about a second,
// therefore I am intentionally loading it only after we have
// handled the "--version" case which becomes much faster as the result.
const lbGenerator = require('generator-loopback');
const yeomanEnv = lbGenerator._yeomanEnv;
assert(yeomanEnv, 'generator-loopback should export _yeomanEnv');

const env = yeomanEnv.createEnv();

// Change the working directory to the generator-loopback module so that
// yeoman can discover the generators
const root = path.dirname(require.resolve('generator-loopback/package.json'));
const cwd = process.cwd();
debug('changing directory to %s', root);
process.chdir(root);

env.lookup(function() {
  debug('changing directory back to %s', cwd);
  process.chdir(cwd); // Switch back

  // list generators
  if (opts.commands) {
    console.log('Available commands: ');
    var list = Object.keys(env.getGeneratorsMeta())
      .filter(name => /^loopback:/.test(name))
      .map(name => name.replace(/^loopback:/, '  lb '));
    console.log(list.join('\n'));
    return;
  }

  const args = opts._;
  const originalCommand = args.shift();
  let command = 'loopback:' + (originalCommand || 'app');
  const supportedCommands = env.getGeneratorsMeta();

  if (!(command in supportedCommands)) {
    command = 'loopback:app';
    args.unshift(originalCommand);
    args.unshift(command);
  } else {
    args.unshift(command);
  }

  debug('invoking generator', args);

  // `yo` is adding flags converted to CamelCase
  const options = camelCaseKeys(opts, {exclude: ['--', /^\w$/, 'argv']});
  Object.assign(options, opts);

  debug('env.run %j %j', args, options);
  env.run(args, options);
});
