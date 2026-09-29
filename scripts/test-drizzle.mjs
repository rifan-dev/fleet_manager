process.env.DATABASE_URL = "postgresql://postgres:" + encodeURIComponent("R@7356844902inan") + "@db.yokdhyfwgoythppmubgs.supabase.co:5432/postgres";

async function main() {
  const { db, vehiclesTable } = await import("../lib/db/src/index.ts");
  console.log("Connecting with Drizzle...");
  const vehicles = await db.select().from(vehiclesTable);
  console.log("Drizzle fetched vehicles:", vehicles.length);
  console.log(vehicles);
  process.exit(0);
}
main().catch(err => {
  console.error("Drizzle query error:", err);
  process.exit(1);
});
