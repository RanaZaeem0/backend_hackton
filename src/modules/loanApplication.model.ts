import mongoose from "mongoose";

export enum LoanCategory {
  WEDDING = 'Wedding',
  HOME_CONSTRUCTION = 'Home Construction',
  BUSINESS_STARTUP = 'Business Startup',
  EDUCATION = 'Education'
}

// Enum for Loan Subcategories
export enum LoanSubcategory {
  // Wedding Subcategories
  VALIMA = 'Valima',
  FURNITURE = 'Furniture',
  VALIMA_FOOD = 'Valima Food',
  JAHEZ = 'Jahez',

  // Home Construction Subcategories
  STRUCTURE = 'Structure',
  FINISHING = 'Finishing',
  HOME_LOAN = 'Home Loan',

  // Business Startup Subcategories
  BUY_STALL = 'Buy Stall',
  ADVANCE_RENT = 'Advance Rent for Shop',
  SHOP_ASSETS = 'Shop Assets',
  SHOP_MACHINERY = 'Shop Machinery',

  // Education Subcategories
  UNIVERSITY_FEES = 'University Fees',
  CHILD_FEES = 'Child Fees Loan'
}

const WitnessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }
});

const LoanApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: Object.values(LoanCategory),
    required: true
  },
  salarySlipImg: {
    type: String,
  },
  subcategory: {
    type: String,
    enum: Object.values(LoanSubcategory),
    required: true
  },
  loanAmount: {
    type: Number,
    required: true
  },
  loanPeriod: {
    type: Number,
    required: true
  },
  initialDeposit: {
    type: Number,
    default: 0
  },
  statementAndSalarySheet: {
    type: String,
    default: null
  },
  witnesses1: {
    type: [WitnessSchema],
  },
  witnesses2:{
    type:[WitnessSchema]
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  tokenNumber: {
    type: String,
    unique: true
  },
  appointmentDetails: {
    date: Date,
    time: String,
    officeLocation: String
  },
  qrCode: {
    type: String,
    default: null
  }
}, { 
  timestamps: true 
});

const LoanApplication = mongoose.model('LoanApplication', LoanApplicationSchema);

export {LoanApplication}


