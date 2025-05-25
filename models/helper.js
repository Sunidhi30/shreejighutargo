// Calculate remaining lock days for vendor
const calculateRemainingLockDays = (vendor) => {
    if (!vendor.walletLockEndDate) {
      return 0;
    }
    
    const lockEndDate = new Date(vendor.walletLockEndDate);
    const currentDate = new Date();
    const timeDiff = lockEndDate - currentDate;
    const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    
    return remainingDays;
  };
  
  // Check if vendor can make withdrawal
  const canVendorWithdraw = (vendor) => {
    if (!vendor.walletLockEndDate) {
      return true; // No lock set
    }
    
    const currentDate = new Date();
    const lockEndDate = new Date(vendor.walletLockEndDate);
    return currentDate >= lockEndDate;
  };
  
  // Check if vendor needs notification (1-2 days before expiry)
  const needsExpiryNotification = (vendor, notificationDays = 2) => {
    if (!vendor.walletLockEndDate || vendor.lockExpiryNotificationSent) {
      return false;
    }
    
    const currentDate = new Date();
    const lockEndDate = new Date(vendor.walletLockEndDate);
    const timeDiff = lockEndDate - currentDate;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Send notification if 1-2 days remaining and not already sent
    return daysRemaining <= notificationDays && daysRemaining > 0;
  };