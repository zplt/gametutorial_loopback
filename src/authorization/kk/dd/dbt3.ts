/* eslint-disable @typescript-eslint/naming-convention */


//import { Logger } from 'log-driver';

const log = require('log-driver').logger;

type DPT3Value = {
  decr_incr: number;
  data: number;
};

//
// DPT3.*: 4-bit dimming/blinds control
//
export const formatAPDU = (value: DPT3Value): Buffer => {
  if (value == null) {
    return log.warn('DPT3: cannot write null value');
  }

  if (typeof value === 'object' && 'decr_incr' in value && 'data' in value) {
    return Buffer.from([(value.decr_incr << 3) + (value.data & 0b00000111)]);
  }

  log.error('DPT3: Must supply a value object of {decr_incr, data}');
  return Buffer.from([0]);
};

export const fromBuffer = (buf: Buffer) => {
  if (buf.length !== 1) {
    return log.error('DPT3: Buffer should be 1 byte long');
  }

  return {
    decr_incr: (buf[0] & 0b00001000) >> 3,
    data: buf[0] & 0b00000111,
  };
};

// DPT basetype info hash
export const basetype = {
  bitlength: 4,
  valuetype: 'composite',
  desc: '4-bit relative dimming control',
};

// DPT subtypes info hash
export const subtypes = {
  // 3.007 dimming control
  '007': {
    name: 'DPT_Control_Dimming',
    desc: 'dimming control',
  },

  // 3.008 blind control
  '008': {
    name: 'DPT_Control_Blinds',
    desc: 'blinds control',
  },
};


/*
        2.6.3.5 Behavior
Status
off     dimming actuator switched off
on      dimming actuator switched on, constant brightness, at least
        minimal brightness dimming
dimming actuator switched on, moving from actual value in direction of
        set value
Events
    position = 0        off command
    position = 1        on command
    control = up dX     command, dX more bright dimming
    control = down dX   command, dX less bright dimming
    control = stop      stop command
    value = 0           dimming value = off
    value = x%          dimming value = x% (not zero)
    value_reached       actual value reached set value

The step size dX for up and down dimming may be 1/1, 1/2, 1/4, 1/8, 1/16, 1/32 and 1/64 of
the full dimming range (0 - FFh).

3.007 dimming control
3.008 blind control
*/