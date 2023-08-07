/* eslint-disable @typescript-eslint/naming-convention */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const log = require('log-driver').logger;

type DPTType = {
  id: string;
  basetype: {
    bitlength: number;
    valuetype: string;
    desc: string;
    range?: [number, number];
    signedness?: string;
  };
  subtypes?: {[key: string]: {scalar_range: [number, number]}};
  formatAPDU: (value: number | boolean | string) => Buffer;
  fromBuffer: (buf: Buffer) => number | boolean | string;
}

type DPTResolveFunction = (dptid: string) => DPTType;

const dpts: {[key: string]: DPTType} = {};

for (const entry of fs.readdirSync(__dirname)) {
  const matches = entry.match(/(dpt.*)\.ts/);
  if (!matches) continue;
  const dptid = matches[1].toUpperCase(); // DPT1..DPTxxx
  const mod: DPTType = require(path.join(__dirname, entry));
  if (
    !('basetype' in mod) || !('bitlength' in mod.basetype)
  )
    throw new Error('incomplete ' + dptid + ', missing basetype and/or bitlength!');
  mod.id = dptid;
  dpts[dptid] = mod;
}


// a generic DPT resolution function
// DPTs might come in as 9/"9"/"9.001"/"DPT9.001"
dpts.resolve = (dptid: string | number) :DP => {
  const m = dptid
    .toString()
    .toUpperCase()
    .match(/^(?:DPT)?(\d+)(\.(\d+))?$/);
  if (m === null) throw new Error('Invalid DPT format: ' + dptid);

  const dpt = dpts[util.format('DPT%s', m[1])];
  if (!dpt) throw new Error('Unsupported DPT: ' + dptid);

  const cloned_dpt = cloneDpt(dpt);
  if (m[3]) {
    cloned_dpt.subtypeid = m[3];
    cloned_dpt.subtype = cloned_dpt.subtypes?.[m[3]];
  }

  return cloned_dpt;
};

/* POPULATE an APDU object from a given Javascript value for the given DPT
 * - either by a custom DPT formatAPDU function
 * - or by this generic version, which:
 * --  1) checks if the value adheres to the range set from the DPT's bitlength
 *
 */
dpts.populateAPDU = (value: any, apdu: {data: Buffer; bitlength: number}, dptid?: string) => {
  const dpt = dpts.resolve(dptid ?? 'DPT1');
  const nbytes = Math.ceil(dpt.basetype.bitlength / 8);
  apdu.data = Buffer.alloc(nbytes);
  apdu.bitlength = (dpt.basetype && dpt.basetype.bitlength) || 1;
  let tgtvalue = value;
  // get the raw APDU data for the given JS value
  if (typeof dpt.formatAPDU == 'function') {
    // nothing to do here, DPT-specific formatAPDU implementation will handle everything
    apdu.data = dpt.formatAPDU(value);
    return apdu;
  }

  if (!isFinite(value))
    throw util.format('Invalid value, expected a %s', dpt.basetype.desc);
  // check if value is in range, be it explicitly defined or implied from bitlength
  const [r_min, r_max] = 'range' in dpt.basetype
    ? dpt.basetype.range
    : [0, Math.pow(2, dpt.basetype.bitlength) - 1];

  // is there a scalar range? eg. DPT5.003 angle degrees (0=0, ff=360)
  if (
    'subtype' in dpt && 'scalar_range' in dpt.subtype
  ) {
    const [s_min, s_max] = dpt.subtype.scalar_range;
    if (value < s_min || value > s_max) {
      log.trace(
        'Value %j(%s) out of scalar range(%j) for %s',
        value,
        //scalar, //@find scalar
        typeof value,
        dpt.id,
      );
    } else {
      // convert value from its scalar representation
      // e.g. in DPT5.001, 50(%) => 0x7F , 100(%) => 0xFF
      const a = (s_max - s_min) / (r_max - r_min);
      const b = s_min - r_min;
      tgtvalue = Math.round((value - b) / a);
    }
  }
  // just a plain numeric value, only check if within bounds
  else if (value < r_min || value > r_max) {
    log.trace(
      'Value %j(%s) out of bounds(%j) for %s.%s',
      value,
      typeof value, //@zhri get rid of "range"
      dpt.id,
      dpt.subtypeid,
    );
  }

  // generic APDU is assumed to convey an unsigned integer of arbitrary bitlength
  if (
    'signedness' in dpt.basetype &&
    dpt.basetype.signedness === 'signed'
  ) {
    apdu.data.writeIntBE(tgtvalue, 0, nbytes);
  } else {
    apdu.data.writeUIntBE(tgtvalue, 0, nbytes);
  }
};

/* get the correct Javascript value from an APDU buffer for the given DPT
 * - either by a custom DPT formatAPDU function
 * - or by this generic version, which:
 * --  1) checks if the value adheres to the range set from the DPT's bitlength
 */
dpts.fromBuffer = (buf: Buffer, dpt: DPTType) => {
  // sanity check
  if (!dpt) throw util.format('DPT %s not found', dpt);
  // get the raw APDU data for the given JS value
  if (typeof dpt.fromBuffer == 'function') {
    // nothing to do here, DPT-specific fromBuffer implementation will handle everything
    return dpt.fromBuffer(buf);
  }

  if (buf.length > 6) {
    throw new Error('cannot handle unsigned integers more than 6 bytes in length');
  }

  let value = 0;
  if (
    'signedness' in dpt.basetype &&
    dpt.basetype.signedness === 'signed'
  )
    value = buf.readIntBE(0, buf.length);
  else value = buf.readUIntBE(0, buf.length);

  if (
    'subtype' in dpt && 'scalar_range' in dpt.subtype
  ) {
    const [r_min, r_max] = 'range' in dpt.basetype
      ? dpt.basetype.range
      : [0, Math.pow(2, dpt.basetype.bitlength) - 1];
    const [s_min, s_max] = dpt.subtype.scalar_range;
    // convert value from its scalar representation
    // e.g. in DPT5.001, 50(%) => 0x7F , 100(%) => 0xFF
    const a = (s_max - s_min) / (r_max - r_min);
    const b = s_min - r_min;
    value = Math.round(a * value + b);
  }

  return value;
};

const cloneDpt = (d: DPTType) => {
  const {fromBuffer, formatAPDU, ...rest} = d;
  return {...JSON.parse(JSON.stringify(rest)), fromBuffer, formatAPDU};
};


module.exports = dpts;
