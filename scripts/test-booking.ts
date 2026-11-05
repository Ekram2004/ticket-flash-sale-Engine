import { BookingRepository } from "../src/modules/bookings/booking.repository.js";
import { db } from "../src/db/pool.js";

const repository = new BookingRepository();

async function testBooking() {
  try {
    const orderId = await repository.createBookingWithAtomicStock(
      "55555555-5555-4555-8555-555555555555",
      "44444444-4444-4444-8444-444444444444",
      "11111111-1111-4111-8111-111111111111",
    );

    console.log("Booking successful!");
    console.log("Order ID:", orderId);
  } catch (error) {
    console.error("Booking failed:", error);
  } finally {
    await db.end();
  }
}

testBooking();
