import { BookingRepository } from "./booking.repository.js";
import { type BookTicketInput } from "./booking.schema.js";

export interface ConfirmBookingInput {
  orderId: string;
  userId: string;
  flashSaleId: string;
  ticketId: string;
}

export interface BookingResponseDto {
  id: string;
  order_id: string;
  user_id: string;
  flash_sale_id: string;
  status: "CONFIRMED" | "CANCELLED" | "REFUNDED";
  created_at: string;
}


export class BookingService {
  private bookingRepository: BookingRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  async fulfillPaidOrder(input: ConfirmBookingInput): Promise<string> {
    const crypto = await import("node:crypto");
    const bookingId = crypto.randomUUID();
    const issuedTicketId = crypto.randomUUID();

    return this.bookingRepository.settleTransaction(
      bookingId,
      issuedTicketId,
      input.orderId,
      input.userId,
      input.flashSaleId,
      input.ticketId,
    );
  }
  async getUserHistory(userId: string): Promise<BookingResponseDto[]> {
    const rows = await this.bookingRepository.getBookingsByUser(userId);
    return rows.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      user_id: row.user_id,
      flash_sale_id: row.flash_sale_id,
      status: row.status,
      created_at: row.created_at.toISOString(),
    }));
  }
}
