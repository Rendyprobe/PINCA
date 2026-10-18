import { z } from 'zod';

export const imageRefSchema = z.object({
  type: z.enum(['emoji', 'svg']),
  value: z.string().min(1, 'Nilai gambar tidak boleh kosong'),
  alt: z.string().min(1, 'Alt gambar wajib diisi demi aksesibilitas'),
});

export const baseItemSchema = z.object({
  id: z.string().min(1, 'ID item wajib diisi'),
  level: z.enum(['letter', 'syllable', 'word', 'sentence', 'story']),
  text: z.string().min(1, 'Teks wajib diisi'),
  ttsText: z.string().optional(),
  audioSrc: z.string().optional(),
  acceptedAliases: z.array(z.string()).optional(),
  image: imageRefSchema.optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export const letterItemSchema = baseItemSchema.extend({
  level: z.literal('letter'),
  upper: z.string().min(1),
  lower: z.string().min(1),
  soundTts: z.string().min(1),
  nameTts: z.string().min(1),
  exampleWordId: z.string().min(1),
});

export const syllableItemSchema = baseItemSchema.extend({
  level: z.literal('syllable'),
  letters: z.array(z.string().min(1)).min(1),
});

export const wordItemSchema = baseItemSchema
  .extend({
    level: z.literal('word'),
    syllables: z.array(z.string().min(1)).min(1),
    imageRequired: z.boolean(),
  })
  .refine(
    (item) => item.syllables.join('').toLowerCase() === item.text.toLowerCase(),
    {
      message: 'Gabungan suku kata harus sama dengan teks kata',
      path: ['syllables'],
    },
  );

export const sentenceItemSchema = baseItemSchema.extend({
  level: z.literal('sentence'),
  words: z.array(z.string().min(1)).min(1),
  punctuation: z.enum(['.', '?', '!']),
  wordIds: z.array(z.string().nullable()).optional(),
});

export const storyItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  level: z.literal('story'),
  pages: z
    .array(
      z.object({
        sentenceIds: z.array(z.string().min(1)),
        illustration: imageRefSchema,
      }),
    )
    .min(1),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        options: z
          .array(
            z.object({
              text: z.string().min(1),
              image: imageRefSchema.optional(),
            }),
          )
          .min(2),
        answerIndex: z.number().int().min(0),
      }),
    )
    .min(1),
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export const letterItemsFileSchema = z.array(letterItemSchema);
export const syllableItemsFileSchema = z.array(syllableItemSchema);
export const wordItemsFileSchema = z.array(wordItemSchema);
export const sentenceItemsFileSchema = z.array(sentenceItemSchema);
export const storyItemsFileSchema = z.array(storyItemSchema);

export const activityConfigSchema = z.object({
  type: z.string().min(1),
  options: z.record(z.unknown()).optional(),
});

export const lessonSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1),
  title: z.string().min(1),
  itemIds: z.array(z.string().min(1)).min(1),
  activities: z.array(activityConfigSchema).min(1),
  unlockAfter: z.array(z.string()).optional(),
});

export const lessonsFileSchema = z.array(lessonSchema);

export const zoneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().min(1),
  lessonIds: z.array(z.string()),
  order: z.number().int(),
});

export const zonesFileSchema = z.array(zoneSchema);

export const feedbackFileSchema = z.object({
  praises: z.array(z.string().min(1)).min(8, 'Minimal 8 variasi pujian'),
  encouragements: z
    .array(z.string().min(1))
    .min(6, 'Minimal 6 variasi penyemangat'),
  hints: z.array(z.string().min(1)).min(4, 'Minimal 4 variasi petunjuk lembut'),
});

export const badgeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  requirementType: z.enum([
    'lessons_completed',
    'stars_collected',
    'zone_completed',
  ]),
  threshold: z.number().int().min(1),
  targetZoneId: z.string().optional(),
});

export const badgesFileSchema = z.array(badgeSchema);
