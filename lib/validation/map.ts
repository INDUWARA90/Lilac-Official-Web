import { z } from "zod";

export const mapCategorySchema = z.enum(["stall", "stage", "food"]);

export const createMapPlaceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100, "Name is too long."),
  category: mapCategorySchema,
  description: z
    .string()
    .trim()
    .min(3, "Please enter what is sold or performed (at least 3 characters).")
    .max(500, "Description is too long."),
  location_tag: z.string().trim().min(2, "Location tag must be at least 2 characters.").max(100, "Location tag is too long."),
  position_x: z.coerce.number().min(-150).max(150),
  position_z: z.coerce.number().min(-150).max(150),
});

export const updateMapPlaceSchema = z.object({
  id: z.string().uuid("Invalid place ID."),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100, "Name is too long.").optional(),
  category: mapCategorySchema.optional(),
  description: z
    .string()
    .trim()
    .min(3, "Please enter what is sold or performed (at least 3 characters).")
    .max(500, "Description is too long.")
    .optional(),
  location_tag: z.string().trim().min(2, "Location tag must be at least 2 characters.").max(100, "Location tag is too long.").optional(),
  position_x: z.coerce.number().min(-150).max(150).optional(),
  position_z: z.coerce.number().min(-150).max(150).optional(),
});

export type CreateMapPlaceInput = z.infer<typeof createMapPlaceSchema>;
export type UpdateMapPlaceInput = z.infer<typeof updateMapPlaceSchema>;
