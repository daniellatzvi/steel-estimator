// Weight per linear foot (lbs/ft) for common steel sections
// Source: AISC Steel Construction Manual

export const AISC_WEIGHTS = {
  // Wide Flange (W shapes) - lbs/ft
  'W4X13': 13, 'W5X16': 16, 'W5X19': 19,
  'W6X9': 9, 'W6X12': 12, 'W6X15': 15, 'W6X16': 16, 'W6X20': 20, 'W6X25': 25,
  'W8X10': 10, 'W8X13': 13, 'W8X15': 15, 'W8X18': 18, 'W8X21': 21, 'W8X24': 24,
  'W8X28': 28, 'W8X31': 31, 'W8X35': 35, 'W8X40': 40, 'W8X48': 48, 'W8X58': 58, 'W8X67': 67,
  'W10X12': 12, 'W10X15': 15, 'W10X17': 17, 'W10X19': 19, 'W10X22': 22, 'W10X26': 26,
  'W10X30': 30, 'W10X33': 33, 'W10X39': 39, 'W10X45': 45, 'W10X49': 49, 'W10X54': 54,
  'W10X60': 60, 'W10X68': 68, 'W10X77': 77, 'W10X88': 88, 'W10X100': 100, 'W10X112': 112,
  'W12X14': 14, 'W12X16': 16, 'W12X19': 19, 'W12X22': 22, 'W12X26': 26, 'W12X30': 30,
  'W12X35': 35, 'W12X40': 40, 'W12X45': 45, 'W12X50': 50, 'W12X53': 53, 'W12X58': 58,
  'W12X65': 65, 'W12X72': 72, 'W12X79': 79, 'W12X87': 87, 'W12X96': 96, 'W12X106': 106,
  'W12X120': 120, 'W12X136': 136, 'W12X152': 152, 'W12X170': 170, 'W12X190': 190,
  'W14X22': 22, 'W14X26': 26, 'W14X30': 30, 'W14X34': 34, 'W14X38': 38, 'W14X43': 43,
  'W14X48': 48, 'W14X53': 53, 'W14X61': 61, 'W14X68': 68, 'W14X74': 74, 'W14X82': 82,
  'W14X90': 90, 'W14X99': 99, 'W14X109': 109, 'W14X120': 120, 'W14X132': 132,
  'W16X26': 26, 'W16X31': 31, 'W16X36': 36, 'W16X40': 40, 'W16X45': 45, 'W16X50': 50,
  'W16X57': 57, 'W16X67': 67, 'W16X77': 77, 'W16X89': 89, 'W16X100': 100,
  'W18X35': 35, 'W18X40': 40, 'W18X46': 46, 'W18X50': 50, 'W18X55': 55, 'W18X60': 60,
  'W18X65': 65, 'W18X71': 71, 'W18X76': 76, 'W18X86': 86, 'W18X97': 97, 'W18X106': 106,
  'W21X44': 44, 'W21X50': 50, 'W21X57': 57, 'W21X62': 62, 'W21X68': 68, 'W21X73': 73,
  'W21X83': 83, 'W21X93': 93, 'W21X101': 101,
  'W24X55': 55, 'W24X62': 62, 'W24X68': 68, 'W24X76': 76, 'W24X84': 84, 'W24X94': 94,
  'W24X104': 104, 'W24X117': 117, 'W24X131': 131,
  'W27X84': 84, 'W27X94': 94, 'W27X102': 102, 'W27X114': 114,
  'W30X90': 90, 'W30X99': 99, 'W30X108': 108, 'W30X116': 116,
  'W33X118': 118, 'W33X130': 130, 'W33X141': 141,
  'W36X135': 135, 'W36X150': 150, 'W36X160': 160, 'W36X170': 170,

  // S shapes (Standard I-Beam)
  'S3X5.7': 5.7, 'S4X7.7': 7.7, 'S5X10': 10, 'S6X12.5': 12.5,
  'S8X18.4': 18.4, 'S8X23': 23, 'S10X25.4': 25.4, 'S10X35': 35,
  'S12X31.8': 31.8, 'S12X35': 35, 'S12X40.8': 40.8, 'S12X50': 50,
  'S15X42.9': 42.9, 'S15X50': 50, 'S18X54.7': 54.7, 'S18X70': 70,

  // Channels (C shapes) - lbs/ft
  'C3X4.1': 4.1, 'C3X5': 5, 'C3X6': 6,
  'C4X5.4': 5.4, 'C4X7.25': 7.25,
  'C5X6.7': 6.7, 'C5X9': 9,
  'C6X8.2': 8.2, 'C6X10.5': 10.5, 'C6X13': 13,
  'C7X9.8': 9.8, 'C7X12.25': 12.25, 'C7X14.75': 14.75,
  'C8X11.5': 11.5, 'C8X13.75': 13.75, 'C8X18.75': 18.75,
  'C9X13.4': 13.4, 'C9X15': 15, 'C9X20': 20,
  'C10X15.3': 15.3, 'C10X20': 20, 'C10X25': 25, 'C10X30': 30,
  'C12X20.7': 20.7, 'C12X25': 25, 'C12X30': 30,
  'C15X33.9': 33.9, 'C15X40': 40, 'C15X50': 50,

  // Angles (L shapes) equal leg - lbs/ft
  'L2X2X1/4': 1.65, 'L2X2X3/8': 2.44, 'L2X2X1/2': 3.19,
  'L2.5X2.5X3/16': 1.55, 'L2.5X2.5X1/4': 2.08, 'L2.5X2.5X3/8': 3.07, 'L2.5X2.5X1/2': 4.1,
  'L3X3X3/16': 1.89, 'L3X3X1/4': 2.53, 'L3X3X5/16': 3.12, 'L3X3X3/8': 3.71, 'L3X3X1/2': 4.9,
  'L3.5X3.5X1/4': 2.99, 'L3.5X3.5X5/16': 3.65, 'L3.5X3.5X3/8': 4.3, 'L3.5X3.5X1/2': 5.8,
  'L4X4X1/4': 3.38, 'L4X4X5/16': 4.18, 'L4X4X3/8': 4.97, 'L4X4X1/2': 6.6, 'L4X4X5/8': 8.2,
  'L5X5X5/16': 5.28, 'L5X5X3/8': 6.3, 'L5X5X1/2': 8.2, 'L5X5X5/8': 10.3, 'L5X5X3/4': 12.3,
  'L6X6X3/8': 7.65, 'L6X6X1/2': 10.1, 'L6X6X5/8': 12.4, 'L6X6X3/4': 14.9, 'L6X6X1': 19.6,

  // Unequal leg angles - lbs/ft
  'L3X2X1/4': 1.92, 'L3X2X5/16': 2.36, 'L3X2X3/8': 2.77,
  'L3.5X2.5X1/4': 2.44, 'L3.5X2.5X5/16': 2.99, 'L3.5X2.5X3/8': 3.58,
  'L4X3X1/4': 2.77, 'L4X3X5/16': 3.38, 'L4X3X3/8': 4.1, 'L4X3X1/2': 5.3,
  'L5X3X1/4': 3.24, 'L5X3X5/16': 4.0, 'L5X3X3/8': 4.74, 'L5X3X1/2': 6.2,
  'L5X3-1/2X1/4': 3.50, 'L5X3-1/2X5/16': 4.32, 'L5X3-1/2X3/8': 5.1,
  'L6X3-1/2X5/16': 4.99, 'L6X3-1/2X3/8': 5.9, 'L6X3-1/2X1/2': 7.78,
  'L6X4X5/16': 5.31, 'L6X4X3/8': 6.3, 'L6X4X1/2': 8.3,
  'HSS2X2X1/8': 1.54, 'HSS2X2X3/16': 2.27, 'HSS2X2X1/4': 2.93,
  'HSS3X3X1/8': 2.39, 'HSS3X3X3/16': 3.48, 'HSS3X3X1/4': 4.51, 'HSS3X3X5/16': 5.48, 'HSS3X3X3/8': 6.39,
  'HSS3-1/2X3-1/2X3/16': 4.09, 'HSS3-1/2X3-1/2X1/4': 5.34, 'HSS3-1/2X3-1/2X5/16': 6.53, 'HSS3-1/2X3-1/2X3/8': 7.66,
  'HSS4X4X1/8': 3.22, 'HSS4X4X3/16': 4.75, 'HSS4X4X1/4': 6.16, 'HSS4X4X5/16': 7.51, 'HSS4X4X3/8': 8.77, 'HSS4X4X1/2': 11.1,
  'HSS5X5X3/16': 6.01, 'HSS5X5X1/4': 7.81, 'HSS5X5X5/16': 9.51, 'HSS5X5X3/8': 11.1, 'HSS5X5X1/2': 14.3,
  'HSS5-1/2X5-1/2X3/16': 6.64, 'HSS5-1/2X5-1/2X1/4': 8.64, 'HSS5-1/2X5-1/2X5/16': 10.6, 'HSS5-1/2X5-1/2X3/8': 12.4,
  'HSS6X6X3/16': 7.27, 'HSS6X6X1/4': 9.46, 'HSS6X6X5/16': 11.5, 'HSS6X6X3/8': 13.6, 'HSS6X6X1/2': 17.3, 'HSS6X6X5/8': 21.2,
  'HSS7X7X1/4': 11.8, 'HSS7X7X5/16': 14.5, 'HSS7X7X3/8': 17.1, 'HSS7X7X1/2': 22.1,
  'HSS8X8X1/4': 12.7, 'HSS8X8X5/16': 15.6, 'HSS8X8X3/8': 18.4, 'HSS8X8X1/2': 23.8, 'HSS8X8X5/8': 29.4,
  'HSS9X9X1/4': 14.5, 'HSS9X9X5/16': 17.8, 'HSS9X9X3/8': 21.1, 'HSS9X9X1/2': 27.2,
  'HSS10X10X1/4': 16.1, 'HSS10X10X5/16': 19.8, 'HSS10X10X3/8': 23.4, 'HSS10X10X1/2': 30.5,
  'HSS12X12X5/16': 24.1, 'HSS12X12X3/8': 28.6, 'HSS12X12X1/2': 37.3,
  // Rectangular HSS
  'HSS6X4X1/4': 8.15, 'HSS6X4X5/16': 9.95, 'HSS6X4X3/8': 11.7, 'HSS6X4X1/2': 14.9,
  'HSS7X5X5/16': 12.1, 'HSS7X5X3/8': 14.4, 'HSS7X5X1/2': 18.8,
  'HSS8X4X1/4': 10.0, 'HSS8X4X3/8': 14.5, 'HSS8X4X1/2': 18.5,
  'HSS8X6X1/4': 11.6, 'HSS8X6X3/8': 17.1, 'HSS8X6X1/2': 21.8,
  'HSS10X4X5/16': 13.3, 'HSS10X4X3/8': 15.8, 'HSS10X4X1/2': 20.5,
  'HSS10X6X5/16': 15.6, 'HSS10X6X3/8': 18.7, 'HSS10X6X1/2': 23.8,
  'HSS12X4X5/16': 15.6, 'HSS12X4X3/8': 18.7, 'HSS12X4X1/2': 24.1,
  'HSS14X4X3/8': 22.2, 'HSS14X4X1/2': 28.6,

  // HSS Round (pipe) - lbs/ft
  'HSS2.5X.25': 2.27, 'HSS3X.25': 2.76, 'HSS3.5X.25': 3.26, 'HSS4X.25': 3.75,
  'HSS4X.375': 5.42, 'HSS5X.25': 4.74, 'HSS5X.375': 6.95, 'HSS6X.25': 5.72,
  'HSS6X.375': 8.44, 'HSS8X.25': 7.69, 'HSS8X.375': 11.4, 'HSS8X.5': 14.7,

  // Standard Pipe - lbs/ft  
  'PIPE1STD': 1.68, 'PIPE1.25STD': 2.27, 'PIPE1.5STD': 2.72, 'PIPE2STD': 3.65,
  'PIPE2.5STD': 5.79, 'PIPE3STD': 7.58, 'PIPE4STD': 10.79, 'PIPE6STD': 18.97,
  'PIPE1XH': 2.17, 'PIPE2XH': 5.02, 'PIPE3XH': 10.25, 'PIPE4XH': 14.98,
};

// Plates are calculated by volume: lbs = (thickness_in x width_in x length_in) / 12 * 0.2833 lbs/in^3
// For plate entries we store lbs per square foot per inch of thickness
export const PLATE_LBS_PER_SQFT_PER_INCH = 40.8; // 0.2833 * 144

/**
 * Normalize unicode fractions and common variations to standard ASCII format
 */
function normalizeSection(section) {
  if (!section) return '';
  return section
    .replace(/⅛/g, '1/8')
    .replace(/¼/g, '1/4')
    .replace(/⅜/g, '3/8')
    .replace(/½/g, '1/2')
    .replace(/⅝/g, '5/8')
    .replace(/¾/g, '3/4')
    .replace(/⅞/g, '7/8')
    .replace(/⅓/g, '1/3')
    .replace(/⅔/g, '2/3')
    .replace(/x/g, 'X')
    // Insert hyphen between digit and fraction: 3½ -> 3-1/2
    .replace(/(\d)(1\/8|1\/4|3\/8|1\/2|5\/8|3\/4|7\/8|1\/3|2\/3)/g, '$1-$2')
    // Convert decimal dimensions to fractional: 3.5 -> 3-1/2, 5.5 -> 5-1/2 (but NOT wall thickness like 0.312)
    .replace(/\b([1-9])\.5\b/g, '$1-1/2')
    .replace(/\b([1-9])\.25\b/g, '$1-1/4')
    .replace(/\b([1-9])\.75\b/g, '$1-3/4')
    .trim();
}

/**
 * Look up weight per foot for a section designation
 * Normalizes input: removes spaces, converts to uppercase, handles common variations
 */
export function lookupWeight(section) {
  if (!section) return null;
  
  // Apply unicode normalization first
  let key = normalizeSection(section).toUpperCase().replace(/\s+/g, '');
  
  // Handle "STD PIPE 3-1/2" or "PIPE 3.5 STD" or "STD PIPE 3½ DIA" formats
  const pipeMatch = key.match(/(?:STD\s*)?PIPE\s*([0-9.\-/]+)/i);
  if (pipeMatch) {
    // Normalize size: 3-1/2 -> 3.5, 3.5 -> 3.5
    let size = pipeMatch[1].replace(/-1\/2$/, '.5').replace(/-1\/4$/, '.25').replace(/-3\/4$/, '.75');
    // Remove trailing non-numeric
    size = size.replace(/[^0-9.]/g, '');
    const schedule = key.includes('XH') ? 'XH' : 'STD';
    const pipeKey = `PIPE${size}${schedule}`;
    if (AISC_WEIGHTS[pipeKey]) return AISC_WEIGHTS[pipeKey];
  }
  
  // Try direct lookup first
  if (AISC_WEIGHTS[key]) return AISC_WEIGHTS[key];
  
  // Handle HSS with decimal wall thickness: HSS10X0.312 -> treat 0.312 as 5/16
  // This handles cases where AI reads wall thickness as decimal instead of fraction
  const hssDecimalWall = key.match(/^(HSS\d+(?:-\d+\/\d+)?X\d+(?:-\d+\/\d+)?)X(0\.\d+)$/);
  if (hssDecimalWall) {
    const base = hssDecimalWall[1];
    const decimal = parseFloat(hssDecimalWall[2]);
    const wallFractions = [[0.125,'1/8'],[0.1875,'3/16'],[0.25,'1/4'],[0.3125,'5/16'],[0.375,'3/8'],[0.5,'1/2'],[0.625,'5/8'],[0.75,'3/4']];
    for (const [val, frac] of wallFractions) {
      if (Math.abs(decimal - val) < 0.01) {
        // For square HSS where only one dimension shown, try NxN format
        const singleDim = base.match(/^HSS(\d+(?:-\d+\/\d+)?)$/);
        const tryKey = singleDim ? `${base}X${singleDim[1]}X${frac}` : `${base}X${frac}`;
        if (AISC_WEIGHTS[tryKey]) return AISC_WEIGHTS[tryKey];
      }
    }
  }
  const decimalToFraction = {
    '.125': '1/8', '.1875': '3/16', '.25': '1/4', '.3125': '5/16',
    '.375': '3/8', '.4375': '7/16', '.5': '1/2', '.5625': '9/16',
    '.625': '5/8', '.6875': '11/16', '.75': '3/4', '.875': '7/8'
  };
  
  let normalized = key;
  for (const [dec, frac] of Object.entries(decimalToFraction)) {
    normalized = normalized.replace(new RegExp(dec.replace('.', '\\.'), 'g'), frac);
  }
  
  if (AISC_WEIGHTS[normalized]) return AISC_WEIGHTS[normalized];
  
  // Try without leading zeros in weight (W8X031 -> W8X31)
  const cleaned = normalized.replace(/X0+(\d)/, 'X$1');
  if (AISC_WEIGHTS[cleaned]) return AISC_WEIGHTS[cleaned];
  
  return null;
}

/**
 * Parse plate section and return weight per foot given a length
 * Plate format: PL1/2X6 (thickness x width) or PL0.5X6
 */
export function parsePlateWeight(section, length_ft) {
  if (!section) return null;
  const upper = section.toUpperCase().replace(/\s+/g, '');
  if (!upper.startsWith('PL')) return null;
  
  // Extract thickness and width from formats like PL1/2X6 or PL0.5X6X12
  const match = upper.match(/PL([0-9./]+)X([0-9.]+)/);
  if (!match) return null;
  
  let thickness = match[1];
  const width = parseFloat(match[2]);
  
  // Convert fraction to decimal
  if (thickness.includes('/')) {
    const parts = thickness.split('/');
    thickness = parseInt(parts[0]) / parseInt(parts[1]);
  } else {
    thickness = parseFloat(thickness);
  }
  
  if (isNaN(thickness) || isNaN(width) || isNaN(length_ft)) return null;
  
  // lbs = thickness(in) * width(in) * length(in) * 0.2833 lbs/in^3
  const length_in = length_ft * 12;
  const weight = thickness * width * length_in * 0.2833;
  return { totalWeight: Math.round(weight * 10) / 10, lbsPerFt: Math.round((weight / length_ft) * 10) / 10 };
}

export function calcTotalWeight(section, quantity, length_ft) {
  if (!section || !quantity || !length_ft) return null;
  
  // Check if it's a plate
  if (section.toUpperCase().startsWith('PL')) {
    const plateResult = parsePlateWeight(section, length_ft);
    if (plateResult) return Math.round(plateResult.totalWeight * quantity * 10) / 10;
    return null;
  }
  
  const lbsPerFt = lookupWeight(section);
  if (lbsPerFt === null) return null;
  
  return Math.round(lbsPerFt * length_ft * quantity * 10) / 10;
}

export function getLbsPerFt(section) {
  if (!section) return null;
  if (section.toUpperCase().startsWith('PL')) return 'varies';
  return lookupWeight(section);
}
