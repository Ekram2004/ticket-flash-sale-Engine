import { randomUUID } from "node:crypto";
import {OrderRepository, type orderDbRow} from "./order.repository.js";

export interface orderReponseDto {
  id: string;
  user_id: string;
  flash_sale_id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  created_at: string;
  expires_at: string;
}

export class OrderService {
  private orderRepo = new OrderRepository();

  private readonly LOCK_DURATION_MINUTES = 10;

  async createOrder(
    user_id: string,
    flash_sale_id: string,
    ticket_id: string,
  ): Promise<string> {
    const orderId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.LOCK_DURATION_MINUTES * 60 * 1000,
    );

    const standardUnitPriceMinor = 5000;
    return this.orderRepo.createOrder(
      orderId,
      user_id,
      flash_sale_id,
      ticket_id,
      standardUnitPriceMinor,
      expiresAt,
    );
  }

  async fetch(): Promise<orderReponseDto[]> {
    const rows: orderDbRow[] = await this.orderRepo.listOrders();
    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      flash_sale_id: row.flash_sale_id,
      status: row.status,
      expires_at: row.expires_at.toISOString(),
      created_at: row.created_at.toISOString(),
    }));
  }
}