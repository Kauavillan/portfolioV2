import { z } from "zod";

export const emailSubjectSchema = z.string().trim().min(1, "subjectRequired");

export const emailBodySchema = z.string().trim().min(1, "messageRequired");

// Campo opcional: permite string vazia e retorna `undefined` após o transform.
export const contactBackEmailSchema = z
  .string()
  .trim()
  .transform((value) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  })
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "returnEmailInvalid",
  });

export const emailFormSchema = z.object({
  subject: emailSubjectSchema,
  body: emailBodySchema,
  contactBackEmail: contactBackEmailSchema,
});

export type EmailFormValues = z.infer<typeof emailFormSchema>;
