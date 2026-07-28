import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Prisma v7 requires a driver adapter for direct DB connections
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ["query"]   // sql query can be seen achese >
});

export default prisma;
