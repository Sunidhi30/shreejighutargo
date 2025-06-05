const Razorpay = require('razorpay');
const axios = require('axios');
const Admin = require('../models/Admin');
const Transaction = require("../models/AdminTransactions");

class PaymentController {
    static async addOrUpdateBankDetails(req, res) {
        try {
            const { adminId } = req.params;
            const { 
              accountNumber, 
              ifscCode, 
             
              accountHolderName, 
             
            } = req.body;
      
            const admin = await Admin.findById(adminId);
            if (!admin) {
              return res.status(404).json({ error: 'Admin not found' });
            }
      
            admin.bankDetails = {
              accountNumber,
              ifscCode,
             
              accountHolderName,
             
            
            };
      
            await admin.save();
      
            res.json({
              success: true,
              message: 'Bank details added successfully',
              bankDetails: admin.bankDetails
            });
      
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
      }
      static async addBankDetails(req, res) {
        try {
          const { adminId } = req.params;
          const { 
            accountNumber, 
            ifscCode, 
            accountHolderName, 
           
          } = req.body;
    
          const admin = await Admin.findById(adminId);
          if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
          }
    
          admin.bankDetails = {
            accountNumber,
            ifscCode,
           
            accountHolderName,
          
          };
    
          await admin.save();
    
          res.json({
            success: true,
            message: 'Bank details added successfully',
            bankDetails: admin.bankDetails
          });
    
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }
    
  static async processWithdrawal(req, res) {
    try {
      const { adminId } = req.params;
      const { amount, description } = req.body;

      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      if (admin.wallet < amount) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
      console.log(admin.wallet)

      if (!admin.bankDetails.accountNumber) {
        return res.status(400).json({ error: 'Bank details not configured' });
      }
      console.log(admin.bankDetails)
      // Initialize RazorpayX instance
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
      });

      // Create Contact
      const contactResponse = await axios.post(
        'https://api.razorpay.com/v1/contacts',
        {
          name: admin.bankDetails.accountHolderName,
          email: admin.email,
          type: 'employee',
          reference_id: admin._id.toString(),
          notes: {
            role: 'admin',
          },
        },
        {
          auth: {
            username: process.env.RAZORPAY_KEY,
            password: process.env.RAZORPAY_SECRET,
          },
        }
      );

      const contactId = contactResponse.data.id;

      // Create Fund Account
      const fundAccountResponse = await axios.post(
        'https://api.razorpay.com/v1/fund_accounts',
        {
          contact_id: contactId,
          account_type: 'bank_account',
          bank_account: {
            name: admin.bankDetails.accountHolderName,
            ifsc: admin.bankDetails.ifscCode,
            account_number: admin.bankDetails.accountNumber,
          },
        },
        {
          auth: {
            username: process.env.RAZORPAY_KEY,
            password: process.env.RAZORPAY_SECRET,
          },
        }
      );

      const fundAccountId = fundAccountResponse.data.id;

      // Create Payout
      const payoutResponse = await axios.post(
        'https://api.razorpay.com/v1/payouts',
        {
          account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // Your RazorpayX account number
          fund_account_id: fundAccountId,
          amount: amount * 100, // Amount in paise
          currency: 'INR',
          mode: 'IMPS',
          purpose: 'payout',
          queue_if_low_balance: true,
          reference_id: `WTH_${Date.now()}`,
          narration: description || 'Wallet withdrawal',
        },
        {
          auth: {
            username: process.env.RAZORPAY_KEY,
            password: process.env.RAZORPAY_SECRET,
          },
        }
      );

      // Deduct amount from wallet
      admin.wallet -= amount;

      // Create transaction record
      const transaction = new Transaction({
        transactionId: payoutResponse.data.reference_id,
        type: 'withdrawal',
        amount: amount,
        currency: 'INR',
        status: 'processing',
        paymentMethod: 'bank_transfer',
        adminId,
        description: description || 'Wallet withdrawal',
        bankDetails: {
          accountNumber: admin.bankDetails.accountNumber,
          ifscCode: admin.bankDetails.ifscCode,
          bankName: admin.bankDetails.bankName,
        },
        gatewayResponse: payoutResponse.data,
      });

      await transaction.save();
      await admin.save();

      res.json({
        success: true,
        message: 'Withdrawal request processed',
        transaction,
        remainingBalance: admin.wallet,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PaymentController;
