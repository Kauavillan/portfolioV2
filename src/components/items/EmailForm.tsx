"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Input from "./Input";
import { emailFormSchema, type EmailFormValues } from "@/validations/emailForm";
import styles from "@styles/EmailForm.module.scss";
import Button from "./Button";
import Loading from "./Loading";
import { useTranslations } from "next-intl";

function zodResolver<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return async (values: unknown) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const fieldErrors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!path) continue;
      if (fieldErrors[path]) continue;
      fieldErrors[path] = { type: issue.code, message: issue.message };
    }

    return { values: {}, errors: fieldErrors };
  };
}

export default function EmailForm() {
  const t = useTranslations("EmailForm");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "success" } | { type: "error"; message: string }
  >({ type: "idle" });

  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [blink, setBlink] = useState<"error" | "success" | undefined>();
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBlink = (type: "error" | "success") => {
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
    }

    // Remove + re-add to replay animation even if already blinking
    setBlink(type);
    blinkTimeoutRef.current = setTimeout(() => {
      setBlink(type);
      blinkTimeoutRef.current = setTimeout(() => {
        setBlink(undefined);
      }, 650);
    }, 0);
  };

  useEffect(() => {
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }

    if (status.type === "idle") return;

    statusTimeoutRef.current = setTimeout(() => {
      setStatus({ type: "idle" });
    }, 5000);

    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
    };
  }, [status]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<EmailFormValues>({
    defaultValues: {
      subject: "",
      body: "",
      contactBackEmail: "",
    },
    resolver: zodResolver(emailFormSchema),
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit(
        async (values) => {
          setStatus({ type: "idle" });

          const contactBackEmail = values.contactBackEmail?.trim() || undefined;

          const res = await fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: values.subject,
              message: values.body,
              contactBackEmail,
            }),
          });

          if (!res.ok) {
            let message = t("messages.error");
            try {
              const data = await res.json();
              if (typeof data?.error === "string") message = data.error;
            } catch {
              // ignore
            }

            triggerBlink("error");
            setStatus({ type: "error", message });
            return;
          }

          setStatus({ type: "success" });
          reset();
          triggerBlink("success");
        },
        () => {
          // Validation errors (zod): RHF does not call the async handler
          triggerBlink("error");
          setStatus({
            type: "error",
            message: t("messages.validationError"),
          });
        }
      ),
    [handleSubmit, reset]
  );
  return (
    <form
      onSubmit={onSubmit}
      className={`${styles.emailForm} ${
        blink === "error"
          ? styles.errorBlink
          : blink === "success"
          ? styles.successBlink
          : ""
      }`}
    >
      <div className={styles.inputs}>
        <Input
          control={control}
          name="subject"
          label={t("subject.label")}
          placeholder={t("subject.placeholder")}
          autoComplete="off"
        />

        <Input
          control={control}
          name="body"
          label={t("message.label")}
          placeholder={t("message.placeholder")}
          textarea
          rows={6}
        />

        <Input
          control={control}
          name="contactBackEmail"
          label={t("returnEmail.label")}
          placeholder={t("returnEmail.placeholder")}
          type="email"
          autoComplete="email"
        />
      </div>
      <div className={styles.buttons}>
        {!isSubmitting ? (
          <Button type="submit" text={t("sendButton")} icon={"send"} link="#" />
        ) : (
          <Loading />
        )}
      </div>

      {status.type === "success" ? (
        <p className={styles.successText}>{t("messages.success")}</p>
      ) : null}
      {status.type === "error" ? (
        <p className={styles.errorText}>{status.message}</p>
      ) : null}
    </form>
  );
}
