// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback-cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const expect = require('./helpers/expect');
const fs = require('fs');
const path = require('path');
const invoke = require('./helpers/invoke');
const sandbox = require('./helpers/sandbox');

const OUR_VERSION = require('../package.json').version;
const GENERATOR_VERSION = require('generator-loopback/package.json').version;
const WORKSPACE_VERSION = require('generator-loopback').workspaceVersion;

// These tests invoke `loopback-cli` in a sub-process and perform
// a very minimal verification of invoked command's results.
//
// To troubleshoot a failing test and find out what prompts and answers
// were processed, set DEBUG=test:responder and re-run the test, e.g.
//   $ DEBUG=test:responder mocha test/smoke.test.js -g datasource
describe('smoke tests - lb', () => {
  beforeEach(sandbox.reset);
  afterEach(reportTranscriptOnTestFailure);

  it('reports version via --version', () => {
    return invoke(['--version']).then(result => {
      expect(result.exitCode).to.eql(0);
      expect(result.stdout).to.contain(OUR_VERSION)
        .and.contain(GENERATOR_VERSION)
        .and.contain(WORKSPACE_VERSION);
    });
  });

  it('reports version via -v', () => {
    return invoke(['-v']).then(result => {
      expect(result.exitCode).to.eql(0);
      expect(result.stdout).to.contain(OUR_VERSION);
    });
  });

  it('reports list of commands via --commands', () => {
    return invoke(['--commands']).then(result => {
      expect(result.exitCode).to.eql(0);
      const lines = result.stdout.split(/\n/g).map(l => l.trim());
      expect(lines).to.include.members([
        'lb model',
        'lb property',
        'lb datasource',
      ]);
    });
  });

  it('reports list of commands via -l', () => {
    return invoke(['-l']).then(result => {
      expect(result.exitCode).to.eql(0);
      const lines = result.stdout.split(/\n/g).map(l => l.trim());
      expect(lines).to.contain('lb model');
    });
  });

  it('creates a new loopback project via "lb"', () => {
    const prompts = {appName: 'test-app', appDir: '.'};
    return invoke(['--skip-install'], prompts)
      .then(result => {
        const pkg = require(sandbox.resolve('package.json'));
        expect(pkg.name, 'package name').to.eql('test-app');

        // Strangely enough, non-prompt text goes to stderr
        expect(result.stderr).to
          .contain('Next steps')
          .and.contain('$ lb model')
          .and.not.contain('$ yo')
          .and.not.contain('loopback:');
      });
  });

  it('creates a new loopback project via "lb app"', () => {
    const prompts = {appName: 'test-app', appDir: '.'};
    return invoke(['app', '--skip-install'], prompts)
      .then(result => {
        const pkg = require(sandbox.resolve('package.json'));
        expect(pkg.name, 'package name').to.eql('test-app');
      });
  });

  it('accepts a name for the loopback project', () => {
    const prompts = {appName: 'my-app', appDir: '.'};
    return invoke(['my-app', '--skip-install'], prompts)
      .then(result => {
        const pkg = require(sandbox.resolve('package.json'));
        expect(pkg.name, 'package name').to.eql('my-app');
      });
  });

  it('honours "lb app" flag --skip-next-steps', () => {
    const prompts = {appName: 'test-app', appDir: '.'};
    return invoke(['app', '--skip-install', '--skip-next-steps'], prompts)
      .then(result => {
        expect(result.stdout).to.not.match(/next steps/i);
        expect(result.stderr).to.not.match(/next steps/i);
      });
  });

  it('creates a model via "lb model"', () => {
    const prompts = {
      modelName: 'test-model',
      exposeModel: true,
      modelPlural: 'test-models',
      propertyName: '',
    };
    return givenProjectInSandbox()
      .then(() => {
        return invoke(['model'], prompts);
      })
      .then(() => {
        const modelJson = require(sandbox.resolve(
          'common/models/test-model.json'
        ));
        expect(modelJson.name, 'model name in JSON').to.equal('test-model');
      });
  });

  it('honours model name specified as CLI arg', () => {
    const prompts = {
      modelName: '', // use the default value built from CLI args
      exposeModel: true,
      modelPlural: 'test-models',
      propertyName: '',
    };
    return givenProjectInSandbox()
      .then(() => {
        return invoke(['model', 'another-model'], prompts);
      })
      .then(() => {
        const modelJson = sandbox.resolve('common/models/another-model.json');
        expect(fs.existsSync(modelJson)).to.be.true();
      });
  });

  it('creates a new model property via "lb property"', () => {
    const prompts = {
      // model: the first name will be selected
      propertyName: 'testProperty',
      // propertyType: "string" will be selected
      // required: NO will be selected
      defaultValue: 'a-value',
    };
    return givenProjectInSandbox()
      .then(() => givenModelWithName('a-model'))
      .then(() => invoke(['property'], prompts))
      .then(() => {
        const model = require(sandbox.resolve('common/models/a-model.json'));
        const properties = model.properties;
        expect(properties).to.have.property('testProperty');
        expect(properties.testProperty).to.have.property('default', 'a-value');
      });
  });

  it('creates a new ACL entry via "lb acl"', () => {
    // Unfortunately, all prompt are selects, which we cannot handle yet.
    // Here are the default answers that we will use:
    //   Select the model to apply the ACL entry to: (all existing models)
    //   Select the ACL scope: All methods and properties
    //   Select the access type: All (match all types)
    //   Select the role All users
    //   Select the permission to apply Explicitly grant access
    const prompts = {};
    return givenProjectInSandbox()
      .then(() => givenModelWithName('a-model'))
      .then(() => invoke(['acl'], prompts))
      .then(() => {
        const model = require(sandbox.resolve('common/models/a-model.json'));
        expect(model.acls).to.eql([{
          accessType: '*',
          principalType: 'ROLE',
          principalId: '$everyone',
          permission: 'ALLOW',
        }]);
      });
  });

  it('creates a new datasource via "lb datasource"', () => {
    const prompts = {
      dataSourceName: 'ds',
      // connector: the first item (memory) will be selected
      localStorageKey: 'a-key',
      serverFile: 'a-file.json',
    };

    return givenProjectInSandbox()
      .then(() => invoke(['datasource'], prompts))
      .then(() => {
        const datasources = require(sandbox.resolve('server/datasources.json'));
        expect(datasources).to.have.property('ds');
        expect(datasources.ds).to.have.property('connector', 'memory');
      });
  });

  it('creates a boot script via "lb boot-script"', () => {
    const prompts = {
      scriptName: 'a-script',
      // scriptType: "async" will be selected
    };
    return givenProjectInSandbox()
      .then(() => invoke(['boot-script'], prompts))
      .then(() => {
        const script = require(sandbox.resolve('server/boot/a-script.js'));
        expect(script).to.be.a('function');
      });
  });

  it('defines a remote method via "lb remote-method"', () => {
    const prompts = {
      // model: the first name will be selected
      methodName: 'testMethod',
      // staticMethod: YES will be selected
      methodDescription: 'A test method',
      // endpoints, accepts and returns - all will be skipped
    };
    return givenProjectInSandbox()
      .then(() => givenModelWithName('a-model'))
      .then(() => invoke(['remote-method'], prompts))
      .then(() => {
        const model = require(sandbox.resolve('common/models/a-model.json'));
        const methods = model.methods;
        expect(methods).to.have.property('testMethod');
        expect(methods.testMethod)
          .to.have.property('description', 'A test method');
      });
  });

  it('configures middleware via "lb remote-method"', () => {
    const prompts = {
      middlewareName: 'test-middleware',
      // middlewarePhase: "5. routes" will be selected
      // middlewareSubPhase: "2. regular" will be selected
      // middlewarePath: no paths will be added
      middlewareConfig: '{ "key": "value" }',
    };
    return givenProjectInSandbox()
      .then(() => invoke(['middleware'], prompts))
      .then(() => {
        const middleware = require(sandbox.resolve('server/middleware.json'));
        const routes = middleware.routes;
        expect(routes)
          .to.have.property('test-middleware')
          .to.have.property('params').eql({key: 'value'});
      });
  });

  it('generates models via "lb swagger"', () => {
    const prompts = {
      url: path.join(__dirname, './fixtures/pets.swagger.json'),
      selectedModels: {pets: 2, Pet: 2, Error: 2},
      dataSource: 'db',
    };

    return givenProjectInSandbox()
      .then(() => invoke(['swagger'], prompts)).then(() => {
        const pets = require(sandbox.resolve('common/models/pets.json'));
        expect(pets.name).to.eql('pets');
        expect(pets.base).to.eql('Model');
        const pet = require(sandbox.resolve('common/models/pet.json'));
        expect(pet.name).to.eql('Pet');
        expect(pet.base).to.eql('PersistedModel');
      });
  });

  it('defines a model relation via "lb relation"', () => {
    const prompts = {
      // modelFrom: select the first one
      // relationType: select the first one ("hasMany")
      // modelTo: select the first one (the same as modelFrom)
      relationName: 'children',
      foreignKey: 'parentId',
      // requireThroughModel: select default (no)
    };

    return givenProjectInSandbox()
      .then(() => givenModelWithName('node'))
      .then(() => invoke(['relation'], prompts))
      .then(() => {
        const model = require(sandbox.resolve('common/models/node.json'));
        expect(model.relations)
          .to.have.property('children')
          .eql({
            type: 'hasMany',
            model: 'node',
            foreignKey: 'parentId',
          });
      });
  });

  // The following generators require the project to have all dependencies
  // installed. Since "npm install" takes very long, we are excluding these
  // commands from automated smoke tests.
  //  - lb export-api-def
  //  - lb swagger

  function givenProjectInSandbox() {
    const prompts = {appName: 'test-app', appDir: '.'};
    return invoke(['app', '--skip-install'], prompts);
  }

  function givenModelWithName(name) {
    const prompts = {
      modelName: name || 'test-model',
      exposeModel: true,
      modelPlural: '',
      propertyName: '',
    };
    return invoke(['model'], prompts);
  }

  function reportTranscriptOnTestFailure() {
    if (this.currentTest.state !== 'failed') return;
    const transcript = invoke.getLastTranscript().trim();
    console.error('--transcript--\n%s\n--end--', transcript);
  }
});

