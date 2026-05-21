const { PrismaClient } = require("../backend/generated/prisma/client");

async function main() {
  const p = new PrismaClient();
  try {
    const rows = await p.employeeFacilityAccess.findMany({
      where: { employeeId: "d7b43562-1c8b-4343-91f3-fa550b3f69dc" },
    });
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

main();
