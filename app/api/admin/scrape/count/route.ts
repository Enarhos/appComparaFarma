import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const [[row]] = await pool.query("SELECT COUNT(*) as total FROM medications") as [{ total: number }[], never];
  return NextResponse.json({ total: Number(row.total) });
}
