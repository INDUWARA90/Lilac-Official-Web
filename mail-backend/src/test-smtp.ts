import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { TicketEmailService } from "./ticket-email.service";

async function main() {
  const recipient = process.argv[2]?.trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Usage: npm run test:smtp -- your-email@example.com");
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  try {
    const mailer = app.get(TicketEmailService);
    const messageId = await mailer.sendTestPass(recipient);
    console.log(`Full sample ticket accepted by SMTP for ${recipient}. Message ID: ${messageId}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "SMTP test failed.");
  process.exitCode = 1;
});
