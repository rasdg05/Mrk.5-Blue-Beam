// Per-car 3D models for the AR viewer.
//
// The sample car (/models/sample-car.glb) is the default for every listing.
// When a real car gets its OWN scanned/commissioned model, drop the optimized
// GLB into /public/models and map it here by the car's id (visible in the admin
// URL: /admin/autos/<id>). That car's page will then show its real model — at
// real-world scale — in 3D and AR, instead of the sample.
//
// (Phase B will move this to a DB field + admin upload + photo→3D pipeline so it
// scales to many cars; this map is the zero-friction path for the first ones.)
export const CAR_MODELS: Record<string, string> = {
  // 'clxxxxxxxxxxxxxxx': '/models/<archivo>.glb',
};

export function getCarModel(carId: string): string | null {
  return CAR_MODELS[carId] ?? null;
}
