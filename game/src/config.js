// Gobble Run! — tuning constants for the whole game.
// One place for the numbers so the feel can be tuned without hunting
// through the world, the farmer and the renderer.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;
export const GROUND_Y = 648; // y of the dirt line the turkey runs on

export const GOAL_METRES = 1000; // reach the Wildwood fence to escape
export const KITCHEN_START_METRES = 600; // the run cuts through the kitchen
export const PIXELS_PER_METRE = 46;

export const START_LIVES = 3;
export const CORN_SCORE = 25;
export const METRE_SCORE = 1;

export const TURKEY = {
  x: 430, // fixed screen x; the world scrolls past
  width: 118,
  height: 96,
  gravity: 2400,
  jumpVelocity: -1120,
  flapVelocity: -880, // second jump (wing flap) is weaker
  duckHeight: 58,
};

export const FARMER = {
  startGap: 340, // pixels behind the turkey at the whistle
  caughtGap: 26, // closer than this and his hands land
  stumbleClose: 120, // a stumble lets him lunge this far
  cornPushBack: 26, // corn bursts shove him back a little
  baseChase: 0.96, // fraction of turkey speed he matches early on
  lateChase: 1.015, // ...and late he is right on your tail feathers
  recoverPerSecond: 7.5, // clean running slowly reopens the gap
};

export const WORLD = {
  baseSpeed: 495, // px per second at the whistle
  speedGainPerMetre: 0.62,
  maxSpeed: 990,
  sprintBoost: 170, // Shift sprint, drains stamina
  staminaMax: 100,
  staminaDrain: 34,
  staminaRegen: 16,
};

export const AUTUMN = {
  skyTop: '#f7b733',
  skyBottom: '#fc4a1a',
  kitchenWall: '#7a3b2e',
  dirt: '#8a5a2b',
  dirtDark: '#6e4520',
};
