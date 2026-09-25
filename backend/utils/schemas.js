const { z } = require('zod');

const advisoryRequestSchema = z.object({
  plot_id: z.string().uuid(),
  soil_ph: z.number().min(0).max(14),
  n_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  p_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  k_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  moisture_percent: z.number().min(0).max(100),
  weather: z.enum(['DRY', 'RAIN', 'EXTREME_HEAT', 'FROST']),
  growth_stage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'HARVEST'])
});

module.exports = { advisoryRequestSchema };
