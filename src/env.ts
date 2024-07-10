import { z } from "zod";
export const env = z.object({});

export const containerEnvSchema = z.object({
  VIRTUAL_HOST: z
    .string()
    .min(3)
    .transform((domains) => domains.split(",")),
  CF_ENABLE: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .refine((value) => value === true),
  CF_PROXY_DISABLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});
