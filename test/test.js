"use strict";

const clientApps = require('../client-apps');
const config = require('../config/common.json');
const testConfig = require('../config/test.json');
const fhc = require('../utils/fhc');
const Project = require('../model/project');
const appium = require('../utils/appium');

describe('Tests for client apps', function() {

  this.timeout(15 * 60 * 1000);

  let driver;

  before(function() {
    return fhc.init(config.host, config.username, config.password);
  });

  testConfig.platforms.forEach(platform => {
    testConfig.types.forEach(type => {
      let apps = clientApps[platform][type];

      if (testConfig.template) {
        apps = apps.filter(app =>
          app.projectTemplateId === testConfig.template
        );
      }

      if (platform === 'ios' && type === 'native' && testConfig.iostype) {
        apps = apps.filter(app =>
          app.name.includes(testConfig.iostype)
        );
      }

      apps.forEach(clientApp => {
        describe(`Test for ${platform} ${type} "${clientApp.name}"`, function() {

          before(function() {
            const project = new Project(clientApp);

            return project.prepare()
              .then(clientApp.prepare)
              .then(clientApp.build);
          });

          after(function() {
            appium.finish(driver);
          });

          beforeEach(function() {
            return appium.init(clientApp)
              .then(d => {
                driver = d;
              });
          });

          afterEach(function() {
            if (this.currentTest.state === 'failed') {
              return appium.takeScreenshot(driver)
                .catch(console.error)
                .then(() => appium.finish(driver));
            }
          });

          clientApp.test(driver);

        });
      });
    });
  });

});
