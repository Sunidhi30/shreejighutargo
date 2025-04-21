// 2. Create the user subscription schema (to track user subscriptions)
const userSubscriptionSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'canceled'],
      default: 'active'
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentId: String,
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  }, { timestamps: true });
  
  const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);