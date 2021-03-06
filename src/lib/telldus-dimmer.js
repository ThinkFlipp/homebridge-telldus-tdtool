'use strict'

const telldus = require('telldus');
const TelldusAccessory = require('./telldus-accessory')
const path = require('path');
var TelldusStorage = require('node-persist')

// Convert 0-255 to 0-100
const bitsToPercentage = value => Math.round(value * 100 / 255)
// Convert 0-100 to 0-255
const percentageToBits = value => Math.round(value * 255 / 100)


/**
 * An Accessory convenience wrapper.
 */
class TelldusDimmer extends TelldusAccessory {

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
  constructor(data, log, homebridge, config) {
    super(data, log, homebridge, config)
    TelldusStorage.initSync({ dir: path.join(homebridge.user.storagePath(), "telldus") })

    this.service
    .getCharacteristic(this.Characteristic.On)
    .on('get', this.getOnState.bind(this))
    .on('set', this.setOnState.bind(this))

    this.service
    .getCharacteristic(this.Characteristic.Brightness)
    .on('get', this.getDimState.bind(this))
    .on('set', this.setDimState.bind(this))

    // Presist dim value. Can't get the value from Telldus, so let's
    // cache it. Presists to disk
    TelldusStorage.getItem(this.name)
    console.log(this.storage);
    if (!this.storage){
      TelldusStorage.setItem(this.name, 0)
    }
  }

  /**
   * Get the on-state of this Dimmer
   *
   * @param  {Function}           callback       To be invoked when result is
   *                                             obtained.
   */
  getOnState(callback) {
    this.log("Getting On-state...");
      this.getState((err, state) => {
        if (!!err) callback(err, null)
        this.log("State is: " + state.name)
        callback(null, state.name !== 'OFF')
      })
  }

  /**
   * Get the on-state of this Dimmer
   *
   * @param  {Function}           callback       To be invoked when result is
   *                                             obtained.
   */
  getDimState(callback) {
    this.log("Getting Dim-state...");
      this.getState((err, state) => {
        if (!!err) callback(err, null)
        if(state.name == 'OFF'){
          this.log("Lightbulb is off and last brightness: " + TelldusStorage.getItem(this.name))
          callback(null, TelldusStorage.getItem(this.name))
        }else{
          this.log("Lightbulb is on, brightness: "
           + bitsToPercentage(state.level) +"%")
          callback(null, bitsToPercentage(state.level))
        }
      })
  }

  /**
   * Set the state of this Accessory with the given Characteristic.
   *
   * @param  {*}                  value          The value to set,
   *                                             corresponding to the passed
   *                                             Characteristic
   * @param  {Function}           callback       To be invoked when result is
   *                                             obtained.
   */
   setOnState(value, callback) {
     this.log('Recieved set On-state request: ' + value)
         if(value){
           // we would like it to return to old dim value
           telldus.dim(this.id, percentageToBits(TelldusStorage.getItem(this.name)), (err) => {
               if (!!err) callback(err, null)
               callback(null, value)
           });
         }else{
           telldus.turnOff(this.id, (err) => {
               if (!!err) callback(err, null)
               callback(null, value)
           })
         }
   }

   /**
    * Set the Dim-state of this Dimmer
    *
    * @param  {*}                  value          The value to set,
    *                                             corresponding to the passed
    *                                             Characteristic
    * @param  {Function}           callback       To be invoked when result is
    *                                             obtained.
    */
   setDimState(value, callback) {
     this.log('Recieved set Dim-state request: ' + value)
       telldus.dim(this.id, percentageToBits(value), (err) => {
           if (!!err) callback(err, null)
           TelldusStorage.setItemSync(this.name, value)
           //Let's set On-state to true
           this.service
            .setCharacteristic(this.Characteristic.On, true);
           callback(null, value)
       });
   }

}

module.exports = TelldusDimmer
