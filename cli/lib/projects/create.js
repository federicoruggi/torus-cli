'use strict';

var _ = require('lodash');
var Promise = require('es6-promise').Promise;

var output = require('../cli/output');
var validate = require('../validate');
var Prompt = require('../cli/prompt');

var create = exports;
create.output = {};

var validator = validate.build({
  name: validate.slug,
  org: validate.slug
});

create.output.success = output.create(function () {
  console.log('Project created.');
});

create.output.failure = output.create(function () {
  console.log('Project creation failed, please try again');
});

create.execute = function (ctx) {
  return new Promise(function (resolve, reject) {
    var orgs;
    ctx.api.orgs.get().then(function (orgResults) {
      orgs = orgResults;
      if (orgs.length === 0) {
        throw new Error('Could not locate organizations');
      }

      ctx.target.flags({
        org: ctx.option('org').value
      });

      var data = {
        name: ctx.params[0],
        org: ctx.target.org
      };

      if (data.name && data.org) {
        var errors = validator(data);
        if (errors.length > 0) {
          return reject(errors[0]);
        }

        return data;
      }

      return create._prompt(data, _.map(orgs, 'body.name'));
    }).then(function (data) {
      var org = _.find(orgs, function (o) {
        return o.body.name === data.org;
      });

      if (!org) {
        throw new Error('Unknown org: ' + data.org);
      }

      return ctx.api.projects.create({
        org_id: org.id,
        name: data.name
      });
    })
    .then(resolve)
    .catch(reject);
  });
};

create._prompt = function (defaults, orgNames) {
  var prompt = new Prompt({
    stages: create._questions,
    defaults: defaults,
    questionArgs: [
      orgNames
    ]
  });

  return prompt.start().then(function (answers) {
    return _.omitBy(_.extend({}, defaults, answers), _.isUndefined);
  });
};

create._questions = function (orgNames) {
  return [
    [
      {
        name: 'name',
        message: 'Project Name',
        validate: validate.slug
      },
      {
        type: 'list',
        name: 'org',
        message: 'Organization the project belongs to',
        choices: orgNames
      }
    ]
  ];
};
