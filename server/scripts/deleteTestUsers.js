const prisma = require('../shared/prisma'); 
// Since scripts is running from server, we can just require the client directly

async function deleteTestUsers() {
  const targetPhones = ["8856063486", "9322419652"];

  for (const phone of targetPhones) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Find user by phone
        const user = await tx.user.findUnique({ where: { phone } });

        if (!user) {
          console.log(`[DELETE SKIPPED] User not found: ${phone}`);
          return;
        }

        console.log(`[DELETE USER] Found: ${user.phone} ${user.id}`);

        // 2. Delete ActivityLog (where user_id)
        // Note: ActivityLog in Prisma doesn't have onDelete: Cascade so we MUST delete these first
        await tx.activityLog.deleteMany({ where: { user_id: user.id } });

        // 3. Delete RefreshToken (where user_id)
        await tx.refreshToken.deleteMany({ where: { user_id: user.id } });

        // 4. Delete Otp (where phone OR user_id)
        await tx.otp.deleteMany({
          where: {
            OR: [
              { user_id: user.id },
              { phone: user.phone }
            ]
          }
        });

        // Delete Crops
        await tx.crop.deleteMany({ where: { user_id: user.id } });

        // Delete FarmerProfile
        await tx.farmerProfile.deleteMany({ where: { user_id: user.id } });
        
        // Delete other related records not explicitly requested but necessary for referential integrity if cascade wasn't there
        await tx.notification.deleteMany({ where: { user_id: user.id } });
        await tx.marketQuery.deleteMany({ where: { user_id: user.id } });
        await tx.advisoryQuery.deleteMany({ where: { user_id: user.id } });

        // 5. Finally delete from User
        await tx.user.delete({ where: { id: user.id } });

        console.log(`[DELETE SUCCESS] ${user.phone}`);
      });
    } catch (err) {
      console.error(`[DELETE FAILED] Error deleting user ${phone}:`, err.message);
    }
  }
}

deleteTestUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
