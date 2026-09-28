"use server";

import { promises as fs } from "fs";
import path from "path";
import type { Order, OrderItem } from "./types";

// Local stand-in for reading/writing the real Supabase `orders`/`order_items`
// tables — a single JSON file shared with the frontend app
// (../backend/local-data/orders.json), so an order placed on the storefront
// actually shows up here without a real backend yet. The frontend's own copy
// of this adapter is at frontend/lib/sharedOrdersFile.ts — same file, same
// shape (this app's Order/OrderItem types already match it directly, since
// they were modeled on the real normalized schema).
const FILE_PATH = path.join(process.cwd(), "..", "backend", "local-data", "orders.json");

interface SharedStore {
  orders: Order[];
  order_items: OrderItem[];
}

async function readSharedStore(): Promise<SharedStore> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as SharedStore;
  } catch {
    return { orders: [], order_items: [] };
  }
}

async function writeSharedStore(store: SharedStore): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function fetchSharedOrders(): Promise<SharedStore> {
  return readSharedStore();
}

// Upserts a single order (and, optionally, replaces its item rows) into the
// shared file — called after every admin mutation (status change, shipping
// update, cancel, refund) so the file stays the single source of truth both
// apps read from.
export async function persistOrder(order: Order, items?: OrderItem[]): Promise<void> {
  const store = await readSharedStore();
  const orders = store.orders.some((o) => o.id === order.id)
    ? store.orders.map((o) => (o.id === order.id ? order : o))
    : [...store.orders, order];
  const order_items = items
    ? [...store.order_items.filter((i) => i.order_id !== order.id), ...items]
    : store.order_items;
  await writeSharedStore({ orders, order_items });
}
