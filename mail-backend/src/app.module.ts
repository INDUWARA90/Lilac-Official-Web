import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TicketEmailService } from "./ticket-email.service";
import { TicketEmailController } from "./ticket-email.controller";

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })], controllers: [TicketEmailController], providers: [TicketEmailService] })
export class AppModule {}
