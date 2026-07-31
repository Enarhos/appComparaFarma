import { randomUUID } from "node:crypto";
import { supabase } from "./supabaseClient.js";

const TABLE = "email_alerts";

export interface CreateAlertInput {
  email: string;
  matchKey: string;
  canonicalName: string;
  targetPrice: number;
}

export interface EmailAlert {
  id: number;
  email: string;
  matchKey: string;
  canonicalName: string;
  targetPrice: number;
  status: "pending" | "active" | "triggered" | "unsubscribed";
  token: string;
}

export async function createAlert(input: CreateAlertInput): Promise<{ token: string } | null> {
  if (!supabase) return null;

  const token = randomUUID();
  try {
    const { error } = await supabase.from(TABLE).insert({
      email: input.email,
      match_key: input.matchKey,
      canonical_name: input.canonicalName,
      target_price: input.targetPrice,
      status: "pending",
      token,
    });
    if (error) {
      console.warn("email_alerts insert failed", error.message);
      return null;
    }
    return { token };
  } catch (err) {
    console.warn("email_alerts insert threw", err);
    return null;
  }
}

export type ConfirmResult = "confirmed" | "not_found" | "unavailable";

export async function confirmAlert(token: string): Promise<ConfirmResult> {
  if (!supabase) return "unavailable";
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: "active", confirmed_at: new Date().toISOString() })
      .eq("token", token)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("email_alerts confirm failed", error.message);
      return "unavailable";
    }
    return data ? "confirmed" : "not_found";
  } catch (err) {
    console.warn("email_alerts confirm threw", err);
    return "unavailable";
  }
}

export type UnsubscribeResult = "unsubscribed" | "not_found" | "unavailable";

export async function unsubscribeAlert(token: string): Promise<UnsubscribeResult> {
  if (!supabase) return "unavailable";
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: "unsubscribed" })
      .eq("token", token)
      .in("status", ["pending", "active"])
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("email_alerts unsubscribe failed", error.message);
      return "unavailable";
    }
    return data ? "unsubscribed" : "not_found";
  } catch (err) {
    console.warn("email_alerts unsubscribe threw", err);
    return "unavailable";
  }
}

interface AlertRow {
  id: number;
  email: string;
  match_key: string;
  canonical_name: string;
  target_price: number;
  status: EmailAlert["status"];
  token: string;
}

function fromRow(row: AlertRow): EmailAlert {
  return {
    id: row.id,
    email: row.email,
    matchKey: row.match_key,
    canonicalName: row.canonical_name,
    targetPrice: row.target_price,
    status: row.status,
    token: row.token,
  };
}

export async function getActiveAlerts(): Promise<EmailAlert[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, email, match_key, canonical_name, target_price, status, token")
      .eq("status", "active");
    if (error) {
      console.warn("email_alerts select active failed", error.message);
      return [];
    }
    return (data ?? []).map((row: AlertRow) => fromRow(row));
  } catch (err) {
    console.warn("email_alerts select active threw", err);
    return [];
  }
}

export async function markTriggered(id: number, price: number): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: "triggered",
        triggered_at: new Date().toISOString(),
        triggered_price: price,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) console.warn("email_alerts markTriggered failed", error.message);
  } catch (err) {
    console.warn("email_alerts markTriggered threw", err);
  }
}

export async function touchLastChecked(ids: number[]): Promise<void> {
  if (!supabase || ids.length === 0) return;
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ last_checked_at: new Date().toISOString() })
      .in("id", ids);
    if (error) console.warn("email_alerts touchLastChecked failed", error.message);
  } catch (err) {
    console.warn("email_alerts touchLastChecked threw", err);
  }
}
