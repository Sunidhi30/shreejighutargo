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
    
    // Process Withdrawal to Admin Bank via RazorpayX
    static async processWithdrawal(req, res) {
        try {
          const { adminId } = req.params;
          const { amount, description } = req.body;
      
          if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid withdrawal amount' });
          }
      
          const admin = await Admin.findById(adminId);
          if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
          }
        console.log( "this is admin isfc   "+ admin.bankDetails.ifscCode);
          if (!admin.bankDetails?.accountNumber || !admin.bankDetails.ifscCode || !admin.bankDetails?.accountHolderName) {
            return res.status(400).json({ error: 'Incomplete bank details' });
          }
      
          if (!admin.wallet || admin.wallet < amount) {
            return res.status(400).json({
              error: 'Insufficient wallet balance',
              currentBalance: admin.wallet || 0,
            });
          }
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(admin.bankDetails.ifscCode)) {
            return res.status(400).json({ error: 'Invalid IFSC format' });
          }
          
          
          const { RAZORPAY_KEY, RAZORPAY_SECRET, RAZORPAY_ACCOUNT_NUMBER } = process.env;
          if (!RAZORPAY_KEY || !RAZORPAY_SECRET || !RAZORPAY_ACCOUNT_NUMBER) {
            return res.status(500).json({ error: 'Payment gateway configuration error' });
          }
      
          // 1. Create Contact - check if already created to avoid duplicates (optional: store contactId in admin)
          let contactId = admin.razorpayContactId;
          if (!contactId) {
            const contactResponse = await axios.post(
              'https://api.razorpay.com/v1/contacts',
              {
                name: admin.bankDetails.accountHolderName,
                email: admin.email,
                type: 'employee',
                reference_id: admin._id.toString(),
                notes: { role: 'admin' },
              },
              {
                auth: {
                  username: RAZORPAY_KEY,
                  password: RAZORPAY_SECRET,
                },
              }
            );
            contactId = contactResponse.data.id;
            admin.razorpayContactId = contactId;
            await admin.save();
          }
      
          // 2. Create Fund Account - similarly, check if already created (optional)
          let fundAccountId = admin.razorpayFundAccountId;
          if (!fundAccountId) {
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
                  username: RAZORPAY_KEY,
                  password: RAZORPAY_SECRET,
                },
              }
            );
            fundAccountId = fundAccountResponse.data.id;
            admin.razorpayFundAccountId = fundAccountId;
            await admin.save();
          }
      
          // 3. Create Payout
          const payoutResponse = await axios.post(
            'https://api.razorpay.com/v1/payouts',
            {
              account_number: RAZORPAY_ACCOUNT_NUMBER,
              fund_account_id: fundAccountId,
              amount: Math.round(amount * 100), // in paise
              currency: 'INR',
              mode: 'IMPS',
              purpose: 'payout',
              queue_if_low_balance: true,
              reference_id: `WTH_${Date.now()}_${adminId.slice(-4)}`,
              narration: description || 'Admin Wallet Withdrawal',
            },
            {
              auth: {
                username: RAZORPAY_KEY,
                password: RAZORPAY_SECRET,
              },
            }
          );
      
          // 4. Save transaction & update wallet
          const transaction = new Transaction({
            transactionId: payoutResponse.data.id,
            type: 'withdrawal',
            amount,
            currency: 'INR',
            status: 'processing',
            paymentMethod: 'bank_transfer',
            adminId,
            description: description || 'Wallet withdrawal',
            bankDetails: {
              accountNumber: admin.bankDetails.accountNumber,
              ifscCode: admin.bankDetails.ifscCode,
              bankName: admin.bankDetails.bankName || '',
            },
            gatewayResponse: payoutResponse.data,
          });
      
          await transaction.save();
      
          admin.wallet -= amount;
          await admin.save();
      
          return res.json({
            success: true,
            message: 'Withdrawal processed successfully',
            transaction: {
              id: transaction._id,
              amount,
              status: transaction.status,
            },
            remainingBalance: admin.wallet,
          });
      
        } catch (error) {
          console.error('Withdrawal Error:', error.response?.data || error.message);
          return res.status(500).json({ error: 'Internal server error', details: error.response?.data || error.message });
        }
      }
}

module.exports = PaymentController;
