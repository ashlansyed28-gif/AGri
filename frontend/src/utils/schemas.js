import { z } from 'zod';

export const advisoryRequestSchema = z.object({
  plot_id: z.string().min(1, 'Plot ID is required'),
  soil_ph: z.number().min(0).max(14),
  n_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  p_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  k_level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  moisture_percent: z.number().min(0).max(100),
  weather: z.enum(['DRY', 'RAIN', 'EXTREME_HEAT', 'FROST']),
  growth_stage: z.enum(['SEEDLING', 'VEGETATIVE', 'FLOWERING', 'HARVEST'])
});
