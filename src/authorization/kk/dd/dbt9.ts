/* eslint-disable @typescript-eslint/naming-convention */

const log = require('log-driver').logger;

const ldexp = (mantissa: number, exponent: number): number => {
  if (exponent > 1023) {
    // avoid multiplying by infinity
    return mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023);
  } else if (exponent < -1074) {
    // avoid multiplying by zero
    return mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074);
  } else {
    return mantissa * Math.pow(2, exponent);
  }
};

const frexp = (value: number): [number, number] => {
  if (value === 0) return [0, 0];
  const data = new DataView(new ArrayBuffer(8));
  data.setFloat64(0, value);
  let bits = (data.getUint32(0) >>> 20) & 0x7ff;
  if (bits === 0) {
    data.setFloat64(0, value * Math.pow(2, 64));
    bits = ((data.getUint32(0) >>> 20) & 0x7ff) - 64;
  }
  const exponent = bits - 1022;
  const mantissa = ldexp(value, -exponent);
  return [mantissa, exponent];
};

export const formatAPDU = (value: number): Buffer => {
  if (!isFinite(value)) {
    log.warn('DPT9: cannot write non-numeric or undefined value');
    return Buffer.from([]);
  }

  const arr = frexp(value);
  const [mantissa, exponent] = arr;
  // find the minimum exponent that will upsize the normalized mantissa (0,5 to 1 range)
  // in order to fit in 11 bits ([-2048, 2047])

  let max_mantissa = 0;
  let e: number | undefined = undefined;
  for (let tmpE = exponent; tmpE >= -15; tmpE--) {
    max_mantissa = ldexp(100 * mantissa, tmpE);
    if (max_mantissa > -2048 && max_mantissa < 2047) {
      e = tmpE;
    }
    break;
  }
  if (typeof e === 'undefined') {
    throw new Error('No suitable exponent found.');
  } //@zhri --> changed the code for more acurate 'e' condition
  const sign = mantissa < 0 ? 1 : 0;
  const mant = mantissa < 0 ? ~(max_mantissa ^ 2047) : max_mantissa;
  const exp = exponent - e;
  // yucks
  return Buffer.from([(sign << 7) + (exp << 3) + (mant >> 8), mant % 256]);
};

export const fromBuffer = (buf: Buffer): number => {
  if (buf.length !== 2) {
    log.warn('DPT9.fromBuffer: buf should be 2 bytes long (got %d bytes)', buf.length);
    return 0;
  }

  const sign = buf[0] >> 7;
  const exponent = (buf[0] & 0b01111000) >> 3;
  let mantissa = 256 * (buf[0] & 0b00000111) + buf[1];
  if (sign) mantissa = ~(mantissa ^ 2047);
  return parseFloat(ldexp(0.01 * mantissa, exponent).toPrecision(15));
};

export const basetype = {
  bitlength: 16,
  valuetype: 'basic',
  desc: '16-bit floating point value',
};

export const subtypes = {
  // 9.001 temperature (oC)
  '001': {
    name: 'DPT_Value_Temp',
    desc: 'temperature',
    unit: '°C',
    range: [-273, 670760],
  },

// 9.002 temperature difference (oC)
  '002': {
    name: 'DPT_Value_Tempd',
    desc: 'temperature difference',
    unit: '°C',
    range: [-670760, 670760],
  },

// 9.003 kelvin/hour (K/h)
  '003': {
    name: 'DPT_Value_Tempa',
    desc: 'kelvin/hour',
    unit: '°K/h',
    range: [-670760, 670760],
  },

// 9.004 lux (Lux)
  '004': {
    name: 'DPT_Value_Lux',
    desc: 'lux',
    unit: 'lux',
    range: [0, 670760],
  },

// 9.005 speed (m/s)
  '005': {
    name: 'DPT_Value_Wsp',
    desc: 'wind speed',
    unit: 'm/s',
    range: [0, 670760],
  },

// 9.006 pressure (Pa)
  '006': {
    name: 'DPT_Value_Pres',
    desc: 'pressure',
    unit: 'Pa',
    range: [0, 670760],
  },

// 9.007 humidity (%)
  '007': {
    name: 'DPT_Value_Humidity',
    desc: 'humidity',
    unit: '%',
    range: [0, 670760],
  },

// 9.008 parts/million (ppm)
  '008': {
    name: 'DPT_Value_AirQuality',
    desc: 'air quality',
    unit: 'ppm',
    range: [0, 670760],
  },

// 9.010 time (s)
  '010': {
    name: 'DPT_Value_Time1',
    desc: 'time(sec)',
    unit: 's',
    range: [-670760, 670760],
  },

// 9.011 time (ms)
  '011': {
    name: 'DPT_Value_Time2',
    desc: 'time(msec)',
    unit: 'ms',
    range: [-670760, 670760],
  },

// 9.020 voltage (mV)
  '020': {
    name: 'DPT_Value_Volt',
    desc: 'voltage',
    unit: 'mV',
    range: [-670760, 670760],
  },

// 9.021 current (mA)
  '021': {
    name: 'DPT_Value_Curr',
    desc: 'current',
    unit: 'mA',
    range: [-670760, 670760],
  },

// 9.022 power density (W/m2)
  '022': {
    name: 'DPT_PowerDensity',
    desc: 'power density',
    unit: 'W/m²',
    range: [-670760, 670760],
  },

// 9.023 kelvin/percent (K/%)
  '023': {
    name: 'DPT_KelvinPerPercent',
    desc: 'Kelvin / %',
    unit: 'K/%',
    range: [-670760, 670760],
  },

// 9.024 power (kW)
  '024': {
    name: 'DPT_Power',
    desc: 'power (kW)',
    unit: 'kW',
    range: [-670760, 670760],
  },

// 9.025 volume flow (l/h)
  '025': {
    name: 'DPT_Value_Volume_Flow',
    desc: 'volume flow',
    unit: 'l/h',
    range: [-670760, 670760],
  },

// 9.026 rain amount (l/m2)
  '026': {
    name: 'DPT_Rain_Amount',
    desc: 'rain amount',
    unit: 'l/m²',
    range: [-670760, 670760],
  },

// 9.027 temperature (Fahrenheit)
  '027': {
    name: 'DPT_Value_Temp_F',
    desc: 'temperature (F)',
    unit: '°F',
    range: -[459.6, 670760],
  },

// 9.028 wind speed (km/h)
  '028': {
    name: 'DPT_Value_Wsp_kmh',
    desc: 'wind speed (km/h)',
    unit: 'km/h',
    range: [0, 670760],
  },
};