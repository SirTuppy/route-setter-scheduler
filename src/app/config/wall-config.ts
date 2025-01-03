interface WallConfig {
  difficulty: number;
  climbsPerSetter: number;
  type: 'boulder' | 'rope';
}

interface GymConfig {
  walls: {
    [key: string]: WallConfig;
  };
}

interface WallMetrics {
  totalClimbs: number;
  difficulty: number;
}

export const DESIGN_GYM_CONFIG: GymConfig = {
  walls: {
    'Cardinal': { 
      difficulty: 1,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'Easter Island': {
      difficulty: 3,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Ziggy High': {
      difficulty: 3,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Ziggy Low': {
      difficulty: 2,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
	'Tidal Wave': {
      difficulty: 5,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Undertow': {
      difficulty: 5,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Reef': {
      difficulty: 3,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Sunset Slab': {
      difficulty: 2,
      climbsPerSetter: 2,
	  type: 'rope',
    },
	'Sunrise Arete': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
	'Speed Wall': {
      difficulty: 3,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Sandy Beaches': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
	'Marianas Trench': {
      difficulty: 3,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Arch': {
      difficulty: 5,
      climbsPerSetter: 1,
	  type: 'rope',
    },
	'Hang 10': {
      difficulty: 3,
      climbsPerSetter: 1,
	  type: 'rope',
    },
    'A1': {
      difficulty: 2,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
    'A2': {
      difficulty: 2,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
    'A3': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'A4': {
      difficulty: 2,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
    'A5': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'A6': {
      difficulty: 5,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'A7': {
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B1': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B2': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
	},
    'B3': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B4': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B5': {
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B6': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B7': {
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C1': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C2': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C3': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C4': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C5': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C6': {
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'C7': {
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    }
  }
};

export const DENTON_GYM_CONFIG: GymConfig = {
  walls: {
    'B1-Titanic': { 
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B2-Ned': { 
      difficulty: 4,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
	'B3-Dusty': { 
      difficulty: 2,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
	'B4-Lucky': { 
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B5-Three Rivers': { 
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B6-Corner Office': { 
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B7-Goiter': { 
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B8-Deception': { 
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B9-Prowl': { 
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
	'B10-SLA': { 
      difficulty: 5,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
	'B10-AAA': { 
      difficulty: 1,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
	'B11-AAB': { 
      difficulty: 1,
      climbsPerSetter: 5,
	  type: 'boulder',
    }
  }
};

export const HILL_GYM_CONFIG: GymConfig = {
  walls: {
    'A1': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'A2': {
      difficulty: 2,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'A3': {
      difficulty: 4,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'A4': {
      difficulty: 3,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'A5': {
      difficulty: 2,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'A6': {
      difficulty: 2,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'A7': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'A8': {
      difficulty: 3,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'B1': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'B2': {
      difficulty: 4,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'B3': {
      difficulty: 5,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'B4': {
      difficulty: 5,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'B5': {
      difficulty: 3,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'B6': {
      difficulty: 2,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'B7': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'B8': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'B9': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'B10': {
      difficulty: 2,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'C1': {
      difficulty: 1,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'C2': {
      difficulty: 2,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'C3': {
      difficulty: 3,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'C4': {
      difficulty: 2,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'D1': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'D2': {
      difficulty: 1,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'D3': {
      difficulty: 2,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'D4': {
      difficulty: 3,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'D5': {
      difficulty: 3,
      climbsPerSetter: 5,
      type: 'boulder',
    },
    'D6': {
      difficulty: 2,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'D7': {
      difficulty: 5,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'D8': {
      difficulty: 5,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'D9': {
      difficulty: 5,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'D10': {
      difficulty: 4,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'D11': {
      difficulty: 4,
      climbsPerSetter: 3,
      type: 'boulder',
    },
    'D12': {
      difficulty: 3,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'D13': {
      difficulty: 2,
      climbsPerSetter: 4,
      type: 'boulder',
    },
    'D14': {
      difficulty: 3,
      climbsPerSetter: 4,
      type: 'boulder',
    },
  },
};

export const PLANO_GYM_CONFIG: GymConfig = {
  walls: {
    'B1': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B2': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B3': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B4': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B5': {
      difficulty: 3,
      climbsPerSetter: 5,
	  type: 'boulder',
    },
    'B6': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B7': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B8': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B9': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B10': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B11': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B12': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'Kids Wall': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'rope',
    },
    'North A': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'North B': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'rope',
    },
    'North C': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'North D': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'rope',
    },
    'North E': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'South Left': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'South Mid': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'South Right': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Speed Wall': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'Tower A': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'Tower B': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'Tower C': {
      difficulty: 3,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'Tower D': {
      difficulty: 1,
      climbsPerSetter: 2,
	  type: 'rope',
    },
    'The Slab': {
      difficulty: 2,
      climbsPerSetter: 2,
	  type: 'rope',
    },
  },
};

export const GRAPEVINE_GYM_CONFIG: GymConfig = {
  walls: {
    'Cove': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Peninsula Left': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Peninsula Mid': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Peninsula Right': {
      difficulty: 3,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Flank': {
      difficulty: 4,
      climbsPerSetter: 1,
	  type: 'rope',
    },
    'Steep Left': {
      difficulty: 5,
      climbsPerSetter: 1,
	  type: 'rope',
    },
    'Steep Right': {
      difficulty: 5,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Canyon Left': {
      difficulty: 2,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'Canyon Right': {
      difficulty: 2,
      climbsPerSetter: 1.5,
	  type: 'rope',
    },
    'B1': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B2': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B3': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B4': {
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B5': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B6': {
      difficulty: 3,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B7': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B8': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B9': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B10': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B11': {
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B12': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
  },
};

export const FORT_WORTH_GYM_CONFIG: GymConfig = {
  walls: {
    'B1': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B2': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B3': {
      difficulty: 4,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B4': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B5': {
      difficulty: 5,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B6': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B7': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B8': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B9': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B10': {
      difficulty: 1,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
    'B11': {
      difficulty: 2,
      climbsPerSetter: 4,
	  type: 'boulder',
    },
  },
};

export const CARROLLTON_TC_GYM_CONFIG: GymConfig = {
  walls: {
    'Star': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    "Frenchie's": {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    "Greg's": {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Boat Ramp': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Main Slab': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Prow Right': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'ProwLeft': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Wave': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Mini-Tex': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'WC Wall': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Campus Board Wall': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Valley Vert': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Valley Slab': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Top Out': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Window Wall': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
  },
};

export const PLANO_TC_GYM_CONFIG: GymConfig = {
  walls: {
    'Slab Left': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Slab Right': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
    'Spray Right': {
      difficulty: 3,
      climbsPerSetter: 3,
	  type: 'boulder',
    },
  },
};

export const VACATION_GYM_CONFIG: GymConfig = {
    walls: {
        'Vacation': {
          difficulty: 0,
          climbsPerSetter: 0,
          type: 'boulder'
        }
    }
}

export const calculateWallMetrics = (
  selectedWalls: string[],
  setterCount: number,
  gymConfig: GymConfig
): WallMetrics => {
  const metrics = selectedWalls.reduce((acc, wallName) => {
    const wallConfig = gymConfig.walls[wallName];
    if (wallConfig) {
      acc.climbsPerSetterSum += wallConfig.climbsPerSetter;
      acc.difficultySum += wallConfig.difficulty;
      acc.wallCount++;
    }
    return acc;
  }, { climbsPerSetterSum: 0, difficultySum: 0, wallCount: 0 });

  // Calculate average climbs per setter across all selected walls
  const avgClimbsPerSetter = metrics.wallCount > 0 ?
    Math.ceil(metrics.climbsPerSetterSum / metrics.wallCount) : 0;

  // Total climbs is the average climbs per setter times number of setters
  return {
    totalClimbs: avgClimbsPerSetter * setterCount,
    difficulty: metrics.wallCount > 0 ?
      Number((metrics.difficultySum / metrics.wallCount).toFixed(1)) : 0
  };
};