'use strict';

const yaml = require('yamljs');
const fs = require('fs');
const path = require('path');

const ArigatoConfigError = require('./errors').ArigatoConfigError;
const resolver = require('./util/resolver');

const arigato = exports;

class Arigato {
  constructor (path, contents) {

    if (typeof path !== 'string' || typeof contents !== 'object') {
      throw new TypeError('Path must be a string, contents must be an object');
    }

    this.path = path;
    this.contents = contents;
  }

  write () {
    return new Promise((resolve, reject) => {
      // Check that we can find, read and write to the file
      var filePath = this.path;

      /*jshint bitwise: false*/
      var contents = this.yaml;
      fs.writeFile(filePath, contents, function(err) {
        if (err) {
          return reject(new ArigatoConfigError(
            'Could not write arigato.yml file: '+filePath
          ));
        }

        resolve();
      });
    });
  }

  get yaml () {
    // Inline after a depth of 5 and use two sapces for indentation.
    return yaml.stringify(this.contents, 5, 2);
  }

  static create (base, opts) {
    return new Promise((resolve, reject) => {

      var filePath = path.join(base, 'arigato.yml');
      var ag = new Arigato(filePath, {
        owner: opts.user_id,
        app: opts.app.slug
      });

      ag.write().then(resolve).catch(reject);
    });
  }

  static find (base) {
    return new Promise((resolve, reject) => {
      resolver.parents(base, 'arigato.yml').then((files) => {
        // The first one (so index 0) is the closest and therefore most relevant
        if (files.length === 0) {
          return resolve(null); // we didn't find anything
        }

        var file = files[0];
        fs.readFile(file, { encoding: 'utf-8' }, function (err, data) {
          if (err) {
            return reject(err);
          }

          try {
            data = yaml.parse(data);
          } catch (err) {
            return reject(new ArigatoConfigError(
              'Invalid YAML in Config: '+file));
          }

          resolve(new Arigato(file, data));
        });
      }).catch(reject);
    });
  }
}

arigato.Arigato = Arigato;