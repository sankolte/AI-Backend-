import { PrismaClient } from "../src/generated/prisma/index.js";

// ../src/generated/prisma/index.js"  will automatcially generate chill

const prisma = new PrismaClient({
    log:["query"]   // sql query can be seen achese >
});

export default prisma;
