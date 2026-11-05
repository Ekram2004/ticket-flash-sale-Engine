import { BookingRepository } from "./booking.repository.js";
import { type BookTicketInput } from "./booking.schema.js";

export class BookingService {
  private bookingRepository: BookingRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  async processTicketBooking(
    input: BookTicketInput,
    userId: string,
    idempotencyKey: string
  ): Promise<string>{
      try {
          return await this.bookingRepository.createBookingWithAtomicStock(
              input.flashSaleId,
              input.ticketId,
              userId,
          );
      } catch (error: unknown) {
          if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
              throw new Error('Ticket inventory not found or sold out');
          }
          throw error;
      }
  }
}