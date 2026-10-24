import { Controller, ForbiddenException, Headers, Param, Post } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TicketEmailService } from "./ticket-email.service";

@Controller("ticket-emails")
export class TicketEmailController {
  constructor(private readonly config: ConfigService, private readonly emails: TicketEmailService) {}
  @Post(":purchaseId/send")
  async send(@Param("purchaseId") purchaseId: string, @Headers("x-mailer-key") key?: string) {
    const expected = this.config.get<string>("MAILER_API_KEY");
    if (!expected || key !== expected) throw new ForbiddenException();
    if (!/^[0-9a-f-]{36}$/i.test(purchaseId)) throw new ForbiddenException("Invalid purchase id.");
    return this.emails.sendForApprovedPurchase(purchaseId);
  }
}
