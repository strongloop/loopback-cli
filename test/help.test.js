// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const expect = require('./helpers/expect');
const fs = require('fs');
const invoke = require('./helpers/invoke');
const mkdirp = require('mkdirp');
const path = require('path');
const sandbox = require('./helpers/sandbox');

const COMMANDS = [
  '',
  'acl',
  'bluemix',
  'boot-script',
  'datasource',
  'export-api-def',
  'middleware',
  'model',
  'oracle',
  'property',
  'relation',
  'remote-method',
  'soap',
  'swagger',
  'zosconnectee',
];

const FIXTURES = path.resolve(__dirname, 'fixtures');
const OUT_FIXTURES = path.join(FIXTURES, 'actual');

describe('help', () => {
  beforeEach(sandbox.reset);
  before(createFixtureOutputDir);

  COMMANDS.forEach(cmd => {
    const args = [];
    if (cmd) args.push(cmd);
    args.push('--help');
    const fullCmd = ['lb'].concat(args);

    it('prints help for "lb ' + args.join(' ') + '"', () => {
      return invoke(args).then(result => {
        let helpFile = 'help-lb';
        if (cmd) helpFile += '-' + cmd;
        helpFile += '.txt';

        const actual = result.stdout;
        fs.writeFileSync(path.resolve(OUT_FIXTURES, helpFile), actual, 'utf-8');

        const expected = fs.readFileSync(
          path.resolve(FIXTURES, helpFile),
          'utf-8'
        );

        expect(actual).to.equal(expected);
      });
    });
  });

  function createFixtureOutputDir() {
    mkdirp.sync(OUT_FIXTURES);
  }
});
