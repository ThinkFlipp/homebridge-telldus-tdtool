'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TelldusAccessoryFactory = require('./lib/telldus-accessory-factory');
var telldus = require('telldus');
var TelldusDoor = require('./lib/telldus-door');
var sqlite3 = require('sqlite3');
var path = require('path');
var inherits = require('util').inherits;

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
    var db = new sqlite3.Database(path.join(homebridge.user.persistPath(), "telldus.db"));
    db.serialize(function () {
      db.run("CREATE TABLE IF NOT EXISTS dimmer (dimmer_id INTEGER, value INTEGER, UNIQUE(dimmer_id))");
      db.run("CREATE TABLE IF NOT EXISTS sensor (sensor_id TEXT, type TEXT, datetime DATETIME, value REAL)");
    });
    this.telldusAccessoryFactory = new TelldusAccessoryFactory(log, config, homebridge, db);
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
  var Characteristic = homebridge.hap.Characteristic;

  var DailyMaxTemperature = function (_Characteristic) {
    _inherits(DailyMaxTemperature, _Characteristic);

    function DailyMaxTemperature() {
      _classCallCheck(this, DailyMaxTemperature);

      var _this2 = _possibleConstructorReturn(this, (DailyMaxTemperature.__proto__ || Object.getPrototypeOf(DailyMaxTemperature)).call(this));

      _this2.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.CELSIUS,
        maxValue: 100,
        minValue: -100,
        minStep: 0.1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      _this2.value = _this2.getDefaultValue();
      return _this2;
    }

    return DailyMaxTemperature;
  }(Characteristic);

  Characteristic.call(DailyMaxTemperature, 'Daily Max Temp', '00000011-0000-1000-8000-MAX6BB765291');

  homebridge.registerPlatform('homebridge-telldus-tdtool', "Telldus-TD-Tool", TelldusTDToolPlatform);
};