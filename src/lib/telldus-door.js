'use strict'

const telldus = require('telldus');
const TelldusAccessory = require('./telldus-accessory')
/**
 * An Accessory convenience wrapper.
 */
class TelldusDoor extends TelldusAccessory {

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

    this.service = new this.Service.Door(this.name)
    this.service.addCharacteristic(this.Characteristic.CurrentDoorState)
    //this.service.removeCharacteristic(this.Characteristic.PositionState)
    //this.service.removeCharacteristic(this.Characteristic.TargetPosition)

    this.service
    .getCharacteristic(this.Characteristic.CurrentPosition)
    .on('get', this.getPosistionState.bind(this))

    this.service
    .getCharacteristic(this.Characteristic.CurrentDoorState)
    .on('get', this.getOpenState.bind(this))

    this.meta
    .setCharacteristic(this.Characteristic.Model, "Door")

    telldus.addDeviceEventListener(this.listenToEvent.bind(this))

    // this.service
    // .getCharacteristic(this.Characteristic.PositionState)
    // .on('get', this.getPositionState.bind(this))
    // )

    //this.addCharacteristic(Characteristic.CurrentPosition); // 0 eller 100
    //this.addCharacteristic(Characteristic.PositionState); //Characteristic.PositionState.STOPPED
    //this.addCharacteristic(Characteristic.TargetPosition);;


  }

  /**
   * Translates ON/OFF to open or closed
   *
   * @param  {string}           state           String, ON or OFF
   *
   */

  _translateStateToDoorStateCharacteristic(state){
    if(state.name === 'ON'){
      return this.Characteristic.CurrentDoorState.OPEN
    }else{
      return this.Characteristic.CurrentDoorState.CLOSED
    }
  }

  _translateOpenStateToCurrentPosition(state){
    if (state.name === 'ON'){
      return 100
    }else {
       return 0
    }
  }

  /**
   * Get the on-state of this Dimmer
   *
   * @param  {Function}           callback       To be invoked when result is
   *                                             obtained.
   */
  getOpenState(callback) {
    this.log("Getting On-state...");

      this.getState((err, state) => {
        if (!!err) callback(err, null)
        this.log("Door is: " + state.name)
        callback(null, this._translateStateToDoorStateCharacteristic(state))
      })
  }

  /**
   * Get the on-state of this Dimmer
   *
   * @param  {Function}           callback       To be invoked when result is
   *                                             obtained.
   */
  getPosistionState(callback) {
    this.log("Getting On-state...");
      this.getState((err, state) => {
        if (!!err) callback(err, null)
        this.log("Door is: " + state.name)
        callback(null, this._translateOpenStateToCurrentPosition(state))
      })
  }


  listenToEvent(id, state){
    if(this.id == id ){
      this.service
      .getCharacteristic(this.Characteristic.CurrentDoorState)
      .setValue(this._translateStateToDoorStateCharacteristic(state));
    }
  }

}

module.exports = TelldusDoor
