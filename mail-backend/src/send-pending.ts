import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { TicketEmailService } from "./ticket-email.service";

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try { console.log(await app.get(TicketEmailService).sendMissingApprovedEmails()); }
  finally { await app.close(); }
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
