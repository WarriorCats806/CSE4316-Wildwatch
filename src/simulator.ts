import type { Detection } from './types';

export const ANIMAL_TYPES = ['White-tailed deer', 'Coyote', 'Raccoon', 'Fox', 'Elk'] as const;
export type AnimalType = typeof ANIMAL_TYPES[number];
export type CrossingRisk = 'low' | 'medium' | 'high';
export type ScenarioId = 'deer-approach' | 'multiple-animals' | 'nighttime' | 'no-wildlife';

export type SimulatedDetection = Detection & {
  simulation: {
    risk: CrossingRisk;
    distanceToRoadM: number;
    movingTowardRoad: boolean;
    scenario: string;
    nighttime: boolean;
  };
};

export function calculateCrossingRisk(distanceToRoadM: number, movingTowardRoad: boolean): CrossingRisk {
  if (movingTowardRoad && distanceToRoadM <= 10) return 'high';
  if (movingTowardRoad && distanceToRoadM <= 30) return 'medium';
  if (!movingTowardRoad && distanceToRoadM <= 10) return 'medium';
  return 'low';
}

export function createSimulatedDetection(input: {
  animal: AnimalType;
  distanceToRoadM: number;
  movingTowardRoad: boolean;
  scenario: string;
  nighttime?: boolean;
  detectedAt?: string;
  id?: string;
}): SimulatedDetection {
  const risk = calculateCrossingRisk(input.distanceToRoadM, input.movingTowardRoad);
  return {
    id: input.id ?? `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    detected_at: input.detectedAt ?? new Date().toISOString(),
    animal_class: input.animal,
    confidence: input.nighttime ? 0.82 : 0.94,
    location_label: 'Sample roadway · north approach',
    warning_triggered: risk === 'high',
    warning_triggered_at: risk === 'high' ? input.detectedAt ?? new Date().toISOString() : null,
    image_url: null,
    notes: `SIMULATED DEMO ONLY · ${input.scenario}`,
    status: 'simulated',
    simulation: {
      risk,
      distanceToRoadM: input.distanceToRoadM,
      movingTowardRoad: input.movingTowardRoad,
      scenario: input.scenario,
      nighttime: input.nighttime ?? false,
    },
  };
}

export function runScenario(scenario: ScenarioId, now = new Date()): SimulatedDetection[] {
  const timestamp = new Date(now);
  let records: SimulatedDetection[] = [];
  if (scenario === 'deer-approach') {
    records = [createSimulatedDetection({ id: 'sim-scenario-deer', animal: 'White-tailed deer', distanceToRoadM: 7, movingTowardRoad: true, scenario: 'Deer approaching road', detectedAt: timestamp.toISOString() })];
  } else if (scenario === 'multiple-animals') {
    records = [
      createSimulatedDetection({ id: 'sim-scenario-multi-deer', animal: 'White-tailed deer', distanceToRoadM: 8, movingTowardRoad: true, scenario: 'Multiple animals detected', detectedAt: timestamp.toISOString() }),
      createSimulatedDetection({ id: 'sim-scenario-multi-coyote', animal: 'Coyote', distanceToRoadM: 18, movingTowardRoad: true, scenario: 'Multiple animals detected', detectedAt: new Date(timestamp.getTime() - 25_000).toISOString() }),
      createSimulatedDetection({ id: 'sim-scenario-multi-raccoon', animal: 'Raccoon', distanceToRoadM: 45, movingTowardRoad: false, scenario: 'Multiple animals detected', detectedAt: new Date(timestamp.getTime() - 50_000).toISOString() }),
    ];
  } else if (scenario === 'nighttime') {
    timestamp.setHours(2, 14, 0, 0);
    records = [createSimulatedDetection({ id: 'sim-scenario-night', animal: 'Fox', distanceToRoadM: 14, movingTowardRoad: true, scenario: 'Nighttime detection', nighttime: true, detectedAt: timestamp.toISOString() })];
  }
  return records;
}

export function scenarioName(scenario: ScenarioId): string {
  return ({
    'deer-approach': 'Deer approaching road',
    'multiple-animals': 'Multiple animals detected',
    nighttime: 'Nighttime detection',
    'no-wildlife': 'No wildlife detected',
  })[scenario];
}
