import { z } from "zod";

// Local post schemas for frontend validation (avoid runtime import interop with @osvs/types)
export const createPostSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  pictureUrl: z.string().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostForm = z.infer<typeof createPostSchema>;
export type UpdatePostForm = z.infer<typeof updatePostSchema>;
