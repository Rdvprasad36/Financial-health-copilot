import { v4 as uuidv4 } from 'uuid';
import { UserProfile, Transaction } from '@fhc/shared';

export interface PersonaData {
  user: UserProfile;
  transactions: Transaction[];
}

export function generateSyntheticPersonas(): { neha: PersonaData; raj: PersonaData; priya: PersonaData } {
  const today = new Date();
  
  // Helper to generate dates spanning the last 12 months
  const generateDates = (days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const dates = generateDates(365); // 1 year of daily transactions

  // ==========================================
  // Persona 1: Steady Neha (Freelance Graphic Designer)
  // Consistent ₹35K-45K/week income
  // Small regular expenses (₹2K-5K ad spend, ₹500-1K platform fees)
  // ==========================================
  const nehaProfile: UserProfile = {
    id: uuidv4(),
    fullName: 'Steady Neha',
    businessType: 'service_creator',
    stateCode: 'KA',
    registeredGst: false,
    presumptiveScheme: '44ADA',
    taxRegime: 'new',
    languagePreference: 'en',
  };

  const nehaTransactions: Transaction[] = [];
  dates.forEach((date, i) => {
    // Generate ~₹5K-6.4K per day to get 35K-45K/week
    const dailyIncome = 5000 + Math.random() * 1428;
    nehaTransactions.push({
      id: uuidv4(),
      userId: nehaProfile.id,
      sourceId: 'src_bank1',
      type: 'income',
      amountPaise: BigInt(Math.round(dailyIncome * 100)),
      currency: 'INR',
      category: 'service_income',
      txnDate: date,
    });

    // Expenses every ~7 days
    if (i % 7 === 0) {
      // Ad spend 2K-5K
      const adSpend = 2000 + Math.random() * 3000;
      nehaTransactions.push({
        id: uuidv4(),
        userId: nehaProfile.id,
        sourceId: 'src_bank1',
        type: 'expense',
        amountPaise: BigInt(Math.round(adSpend * 100)),
        currency: 'INR',
        category: 'ad_spend',
        txnDate: date,
      });
      // Platform fee 500-1K
      const platFee = 500 + Math.random() * 500;
      nehaTransactions.push({
        id: uuidv4(),
        userId: nehaProfile.id,
        sourceId: 'src_bank1',
        type: 'expense',
        amountPaise: BigInt(Math.round(platFee * 100)),
        currency: 'INR',
        category: 'platform_fee',
        txnDate: date,
      });
    }
  });

  // ==========================================
  // Persona 2: Spiky Raj (Instagram Reseller)
  // Highly lumpy: weeks with ₹0, then ₹50K-200K spikes
  // MH state, goods_seller, not GST registered, 44AD new regime
  // Total approx 30-35L turnover
  // ==========================================
  const rajProfile: UserProfile = {
    id: uuidv4(),
    fullName: 'Spiky Raj',
    businessType: 'goods_seller',
    stateCode: 'MH',
    registeredGst: false,
    presumptiveScheme: '44AD',
    taxRegime: 'new',
    languagePreference: 'hinglish',
  };

  const rajTransactions: Transaction[] = [];
  let rajTotalIncome = 0;
  
  // Need to distribute ~32L across ~16 spikes
  dates.forEach((date, i) => {
    // Spikes every ~21 days
    if (i % 21 === 0) {
      const spikeIncome = 150000 + Math.random() * 50000; // ~150K - 200K
      rajTotalIncome += spikeIncome;
      rajTransactions.push({
        id: uuidv4(),
        userId: rajProfile.id,
        sourceId: 'src_upi',
        type: 'income',
        amountPaise: BigInt(Math.round(spikeIncome * 100)),
        currency: 'INR',
        category: 'sales',
        txnDate: date,
      });

      // Shipping expense for the spike
      const shipping = 3000 + Math.random() * 5000;
      rajTransactions.push({
        id: uuidv4(),
        userId: rajProfile.id,
        sourceId: 'src_upi',
        type: 'expense',
        amountPaise: BigInt(Math.round(shipping * 100)),
        currency: 'INR',
        category: 'shipping',
        txnDate: date,
      });
    } else {
      // 0 income days
    }
  });

  // ==========================================
  // Persona 3: Viral Priya (Content Creator)
  // Months 1-6: steady ₹15K-25K/week
  // Month 7: viral, jumps to ₹100K-200K/week for rest of year
  // DL state, service_creator, not GST registered, 44ADA new regime
  // ==========================================
  const priyaProfile: UserProfile = {
    id: uuidv4(),
    fullName: 'Viral Priya',
    businessType: 'service_creator',
    stateCode: 'DL',
    registeredGst: false,
    presumptiveScheme: '44ADA',
    taxRegime: 'new',
    languagePreference: 'en',
  };

  const priyaTransactions: Transaction[] = [];
  dates.forEach((date, i) => {
    const isViral = i > 180; // After 6 months
    const weeklyTarget = isViral 
      ? 100000 + Math.random() * 100000 // 100K - 200K / week
      : 15000 + Math.random() * 10000;  // 15K - 25K / week
    
    const dailyIncome = weeklyTarget / 7;

    priyaTransactions.push({
      id: uuidv4(),
      userId: priyaProfile.id,
      sourceId: 'src_bank2',
      type: 'income',
      amountPaise: BigInt(Math.round(dailyIncome * 100)),
      currency: 'INR',
      category: 'service_income',
      txnDate: date,
    });
  });

  return {
    neha: { user: nehaProfile, transactions: nehaTransactions },
    raj: { user: rajProfile, transactions: rajTransactions },
    priya: { user: priyaProfile, transactions: priyaTransactions },
  };
}
