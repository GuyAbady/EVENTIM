import type messages from "../messages/he.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
  }
}
