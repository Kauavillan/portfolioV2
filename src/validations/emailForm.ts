import { z } from "zod";

export const emailSubjectSchema = z
  .string()
  .trim()
  .min(1, "Informe um assunto");

export const emailBodySchema = z.string().trim().min(1, "Escreva uma mensagem");

// Campo opcional: permite string vazia e retorna `undefined` após o transform.
export const contactBackEmailSchema = z
  .string()
  .trim()
  .transform((value) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  })
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Email inválido",
  });

export const emailFormSchema = z.object({
  subject: emailSubjectSchema,
  body: emailBodySchema,
  contactBackEmail: contactBackEmailSchema,
});

export type EmailFormValues = z.infer<typeof emailFormSchema>;
