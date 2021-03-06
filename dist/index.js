'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TelldusAccessoryFactory = require('./lib/telldus-accessory-factory');
var telldus = require('telldus');
var TelldusDoor = require('./lib/telldus-door');

/**
 * Platform wrapper that fetches the accessories connected to the
 * Tellstick via the CLI tool tdtool.
 */

var TelldusTDToolPlatform = function () {
  function TelldusTDToolPlatform(log, config, homebridge) {
    _classCallCheck(this, TelldusTDToolPlatform);

    this.log = log;
    this.config = config;
    this.homebridge = homebridge;
    this.telldusAccessoryFactory = new TelldusAccessoryFactory(log, config, homebridge);
  }

  _createClass(TelldusTDToolPlatform, [{
    key: 'accessories',
    value: function accessories(callback) {
      var _this = this;

      this.log('Loading devices...');
      telldus.getDevices(function (err, devices) {
        if (err) {
          console.log('Error: ' + err);
        } else {
          // The list of devices is returned
          var len = devices.length;
          _this.log('Found ' + (len || 'no') + ' item' + (len != 1 ? 's' : '') + ' of type "device".');
          telldus.getSensors(function (err, sensors) {
            if (err) {
              console.log('Error: ' + err);
            } else {
              var sensorLen = sensors.length;
              _this.log('Found ' + (sensorLen || 'no') + ' item' + (sensorLen != 1 ? 's' : '') + ' of type "sensors".');

              var rawAccessories = devices.concat(sensors.map(function (s) {
                s.type = 'SENSOR';
                return s;
              }));

              var telldusAccessories = rawAccessories.map(function (accessory) {
                return _this.telldusAccessoryFactory.build(accessory);
              }).filter(function (a) {
                return a != null;
              });
              _this.addEventListeners(telldusAccessories);
              callback(telldusAccessories); //flatten)
            }
          });
        }
      });
    }
  }, {
    key: 'addEventListeners',
    value: function addEventListeners(telldusAccessories) {
      telldus.addDeviceEventListener(function (deviceId, status) {
        var a = telldusAccessories.find(function (accessory) {
          return accessory.id == deviceId;
        });
        if (a && a.respondToEvent) {
          a.respondToEvent(status);
        }
      });

      telldus.addSensorEventListener(function (deviceId, protocol, model, type, value, timestamp) {
        var id = 'sensor' + deviceId;
        var a = telldusAccessories.find(function (accessory) {
          return accessory.id == id;
        });
        if (a && a.respondToEvent) {
          a.respondToEvent(type, value);
        }
      });
    }
  }]);

  return TelldusTDToolPlatform;
}();

/*
 * Register the Telldus tdtool platform as this module.
 */


module.exports = function (homebridge) {
  homebridge.registerPlatform('homebridge-telldus-tdtool', "Telldus-TD-Tool", TelldusTDToolPlatform);
};