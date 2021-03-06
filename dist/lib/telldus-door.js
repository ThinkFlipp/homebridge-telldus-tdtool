'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var telldus = require('telldus');
var TelldusAccessory = require('./telldus-accessory');
var RateLimiter = require('limiter').RateLimiter;
/**
 * An Accessory convenience wrapper.
 */

var TelldusDoor = function (_TelldusAccessory) {
  _inherits(TelldusDoor, _TelldusAccessory);

  /**
   * Inject everything used by the class. No the neatest solution, but nice for
   * testing purposes, and avoiding globals as we don't know anything about
   * Service, Characteristic and other Homebridge things that are injected
   * into exported provider function.
   *
   * @param  {object}  data       The object representation of the device.
   * @param  {hap.Log} log        The log to use for logging.
   * @param  {API}     homebridge The homebridge API, with HAP embedded
   * @param  {object}  config     Configuration object passed on from initial
   *                              instantiation.
   */
  function TelldusDoor(data, log, homebridge, config) {
    _classCallCheck(this, TelldusDoor);

    var _this = _possibleConstructorReturn(this, (TelldusDoor.__proto__ || Object.getPrototypeOf(TelldusDoor)).call(this, data, log, homebridge, config));

    _this.service = new _this.Service.ContactSensor(_this.name);
    //this.service.addCharacteristic(this.Characteristic.ContactSensorState)

    _this.service.getCharacteristic(_this.Characteristic.ContactSensorState).on('get', _this.getContactSensorState.bind(_this));

    _this.meta.setCharacteristic(_this.Characteristic.Model, "Door");

    _this.limiter = new RateLimiter(1, 3 * 1000); //limit to once ever 3s

    return _this;
  }

  /**
   * Get the contact sensor-state of this door
   *
   * @param  {Function}           callback       To be invoked when result is
   *                                             obtained.
   */


  _createClass(TelldusDoor, [{
    key: 'getContactSensorState',
    value: function getContactSensorState(callback) {
      var _this2 = this;

      this.log("Getting Door-state...");

      this.getState(function (err, state) {
        if (!!err) callback(err, null);
        _this2.log("Door is: " + state.name);
        if (state.name === 'ON') {
          callback(null, _this2.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
        } else {
          callback(null, _this2.Characteristic.ContactSensorState.CONTACT_DETECTED);
        }
      });
    }
  }, {
    key: 'respondToEvent',
    value: function respondToEvent(state) {
      var _this3 = this;

      this.limiter.removeTokens(1, function () {
        _this3.log("Got event for door: " + state.name);
        if (state.name === 'ON') {
          _this3.service.getCharacteristic(_this3.Characteristic.ContactSensorState).setValue(_this3.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
        } else {
          _this3.service.getCharacteristic(_this3.Characteristic.ContactSensorState).setValue(_this3.Characteristic.ContactSensorState.CONTACT_DETECTED);
        }
      });
    }
  }]);

  return TelldusDoor;
}(TelldusAccessory);

module.exports = TelldusDoor;