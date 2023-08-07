/* eslint-disable @typescript-eslint/naming-convention */


const log= require('log-driver').logger;

//
// DPT4: 8-bit character
//
export const formatAPDU = (value: string): Buffer => {
  if (value == null) {
    log.warn('DPT4: cannot write null value');
    return Buffer.from([]);
  }

  if (typeof value !== 'string') {
    log.warn('DPT4: Must supply a character or string');
    return Buffer.from([]);
  }

  const apdu_data = value.charCodeAt(0);
  if (apdu_data > 255) {
    log.warn('DPT4: must supply an ASCII character');
    return Buffer.from([]);
  }

  return Buffer.from([apdu_data]);
};

export const fromBuffer = (buf: Buffer): string => {
  if (buf.length !== 1) {
    log.warn('DPT4: Buffer should be 1 byte long');
    return '';
  }

  return String.fromCharCode(buf[0]);
};

export const basetype = {
  bitlength: 8,
  valuetype: 'basic',
  desc: '8-bit character',
};

export const subtypes = {
  // 4.001 character (ASCII)
  '001': {
    name: 'DPT_Char_ASCII',
    desc: 'ASCII character (0-127)',
    range: [0, 127],
    use: 'G',
  },
  // 4.002 character (ISO-8859-1)
  '002': {
    name: 'DPT_Char_8859_1',
    desc: 'ISO-8859-1 character (0..255)',
    use: 'G',
  },
};
