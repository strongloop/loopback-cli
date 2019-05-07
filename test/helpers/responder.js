// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const binlb = require('../../package.json').bin.lb;
const debug = require('debug')('test:responder');
const expect = require('./expect');
const format = require('util').format;

const ANSI_CSI = /\u001b\[(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g; // eslint-disable-line max-len

const PROMPTS = [
  [/\? What's the name of your application\? \(.*\)$/, enter('appName')],
  [/\? .*directory to contain the project: \(.*\)$/, enter('appDir')],
  [/\? Enter the model name:( \(.*\))?$/, enter('modelName')],
  [/\? Custom plural form [^:]*:$/, enter('modelPlural')],
  [/\? .*property name:$/i, enter('propertyName')],
  [/\? default value[^:]*:$/i, enter('defaultValue')],
  [/\? Enter the datasource name:$/, enter('dataSourceName')],
  [/\? Enter the script name[^:]*:$/, enter('scriptName')],
  [/\? Enter the remote method name:$/, enter('methodName')],
  [/\? Description for method:$/, enter('methodDescription')],
  [/\? window\.localStorage key[^:]*:$/, enter('localStorageKey')],
  [/\? Full path to file for persistence[^:]*:$/, enter('serverFile')],
  [/\? Enter the middleware name:$/, enter('middlewareName')],
  [/\? Configuration parameters in JSON format: \({}\)/,
    enter('middlewareConfig')],
  [/\? Enter the property name for the relation: \(.*\)$/,
    enter('relationName')],
  [/^\? Optionally enter a custom foreign key:$/, enter('foreignKey')],

  // Maybe we should send ArrowUp/ArrowDown codes to select an answer?
  [/\? .* \(Use arrow keys\)/, selectDefault()],
  [/\? .* \(y\/n\)$/i, selectDefault()],
  [/\? Enter the path of this endpoint:$/, selectDefault()],
  [/\? What is the name of this argument\?$/, selectDefault()],
  [/\? Path uri:$/, selectDefault()],

  [/\? Enter the swagger spec url or file path:$/, enter('url')],
  [/\? Select models to be generated:/, selectDefault()],
  [/\? Select the datasource to attach models to:$/, selectDefault()],
];

class Responder {
  constructor(responseStream, answers) {
    this._responseStream = responseStream;
    this._answers = answers;
    this._buffer = '';
    this.transcript = '';
  }

  _handleInquirerScreenManipulation(chunk) {
    // Process ANSI control codes that are not significant
    chunk = chunk
      // ignore: show/hide cursor
      .replace(/\u001b\[\?25[hl]/g, '')
      // ignore cursor forward/back
      .replace(/\u001b\[\d+[CD]/g, '');

    this._buffer += chunk;

    if (this._buffer.replace(ANSI_CSI, '').trim() === '') {
      // no text, just ANSI magic - nothing to do
      return;
    }

    if (!this._buffer.match(ANSI_CSI)) {
      // no additional ANSI codes, just text - this is a prompt
      chunk = this._buffer;
      this._buffer = '';
      return chunk;
    }

    const lines = this._buffer.split('\n');
    if (lines.length < 2) {
      // inquirer is printing ANSI CSI sequences to do fancy stuff on the screen
      // wait until it is done and sends a new-line character
      return;
    }

    this._buffer = '';

    // Usually, the first line is ANSI magic overwriting screen
    // to print the answer.
    // However, under certain timing, we may receive a clean multi-line prompt
    // where the first line is part of the prompt and must not be discarded.
    if (lines[0].match(ANSI_CSI)) {
      this._log('DISCARDED ^%s$', lines.shift());
    }

    // The remaining lines is what matters
    chunk = lines.join('\n');
    this._log('REMAINS ^%s$', chunk);

    return chunk;
  }

  detectPromptAndRespond(chunk) {
    chunk = this._handleInquirerScreenManipulation(chunk);
    if (!chunk) return;
    chunk = chunk.replace(/\s+/g, ' ').trim();
    if (!chunk) return;

    for (var ix in PROMPTS) {
      const regexp = PROMPTS[ix][0];
      const action = PROMPTS[ix][1];
      if (regexp.test(chunk)) {
        this._log('PROMPT: ^%s$', chunk);
        action(this._responseStream, this._answers, this._log.bind(this));
        return;
      }
    }

    this._log('IGNORED: ^%s$', chunk);
  }

  _log() {
    const msg = format.apply(null, arguments).replace(/\u001b/g, '<ESC>');
    debug(msg);
    this.transcript += msg + '\n';
  }
}
module.exports = Responder;

function enter(lookupKey) {
  return function respondWithString(stdin, prompts, log) {
    const answer = prompts[lookupKey];
    expect(answer, 'Answer for the prompt ' + lookupKey).to.exist();
    log(' -> Sending %s: %s', lookupKey, JSON.stringify(answer));
    stdin.write(answer + '\n');
  };
}

function selectDefault() {
  return function respondWithDefault(stdin, prompts, log) {
    log(' -> Selecting the default choice');
    stdin.write('\n');
  };
}

