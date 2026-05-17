import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }
}