import { z } from "zod"

const USERNAME_CHARS = /^[a-zA-Z0-9@._\-]+$/

export const createCommunicationSoftwareSchema = () =>
  z.object({
    ipAddress: z
      .string()
      .trim()
      .min(1, "IP address is required")
      .refine((val) => {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        return ipv4Regex.test(val)
      }, "Please enter a valid IP address (e.g., 192.168.1.1)"),
    port: z
      .string()
      .trim()
      .min(1, "Port is required")
      .refine((val) => {
        const portNum = parseInt(val, 10)
        return !isNaN(portNum) && portNum >= 1 && portNum <= 65535
      }, "Port must be a number between 1 and 65535"),
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .refine((val) => !/\s/.test(val), { message: "Username must not contain spaces" })
      .refine((val) => USERNAME_CHARS.test(val), {
        message: "Username can only contain letters, numbers, @, dots (.), underscores (_), and hyphens (-)",
      }),
    password: z
      .string()
      .trim()
      .min(1, "Password is required"),
  })