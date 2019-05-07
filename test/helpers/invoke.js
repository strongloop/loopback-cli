// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const binLb = require('../../package.json').bin.lb;
const debug = require('debug')('test:invoke');
const Responder = require('./responder');
const expect = require('./expect');
const sandbox = require('./sandbox');
const spawn = require('child_process').spawn;

const cliPath = require.resolve('../../' + binLb);

// RegExp matching ANSI control codes and other garbage that we are not
// interested in.
const GARBAGE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g; // eslint-disable-line max-len

module.exports = invokeCli;

function invokeCli(args, prompts) {
  return new Promise((resolve, reject) => {
    const opts = {cwd: sandbox.PATH};
    debug('invokeCli args %j', args, opts);
    args.unshift(cliPath);
    let stdout = '';
    let stderr = '';

    const child = spawn(process.execPath, args, opts);

    const responder = new Responder(child.stdin, prompts);
    invokeCli.getLastTranscript = function() { return responder.transcript; };

    child.stdout.on('data', chunk => {
      let str = chunk.toString('utf-8');
      responder.detectPromptAndRespond(str);

      str = str.replace(GARBAGE, '');
      stdout += str;
    });
    child.stderr.on('data', chunk => stderr += chunk.toString('utf-8'));

    child.on('error', err => {
      debug('--error--\n%s', err.stack || err);
      reject(err);
    });

    child.on('exit', (code, signal) => {
      if (stdout)
        debug('--stdout--', '\n', stdout);
      if (stderr)
        debug('--stderr--', '\n', stderr);
      debug('--[exit code: %s signal: %s]--', code, signal);
      resolve({stdout, stderr, exitCode: code});
    });
  });
}
