const cron = require('node-cron');
const Vendor = require('../models/Vendor');
const sendNotification = require("../utils/sendNotification")
const calculateRemainingLockDays = (vendor) => {
    if (!vendor.walletLockStartDate || !vendor.walletLockDays) {
      return 0;
    }
    
    const lockStartDate = new Date(vendor.walletLockStartDate);
    const currentDate = new Date();
    const daysPassed = Math.floor((currentDate - lockStartDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, vendor.walletLockDays - daysPassed);
    
    return remainingDays;
  };
  
cron.schedule('* * * * *', async () => {
  try {
    const vendors = await Vendor.find({ lastWithdrawalDate: { $exists: true } });

    for (let vendor of vendors) {
      const remainingDays = calculateRemainingLockDays(vendor);
      
      if (remainingDays <= 1 && !vendor.notifiedForUnlock) {
        await sendNotification({
          to: vendor.email,
          subject: 'Withdrawal Lock Period Ending Soon',
          message: `Hi ${vendor.email}, you can request a withdrawal in ${remainingDays} day(s).`
        });

        vendor.notifiedForUnlock = true;
        await vendor.save();
      }
    }

    //console.log('🔔 Vendor withdrawal notifications sent');
  } catch (error) {
    console.error('Error in withdrawal notifier:', error);
  }
});
