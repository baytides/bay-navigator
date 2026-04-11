#!/usr/bin/env node
/**
 * Sync California State Codes Content
 *
 * Scrapes actual text content from California Legislature website for
 * commonly-asked-about code sections. This allows Carl to answer
 * specific legal questions with actual law text.
 *
 * Output: public/data/california-codes-content.json
 *
 * Usage:
 *   node scripts/sync-california-codes.cjs
 *   node scripts/sync-california-codes.cjs --verbose
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, '..', '..', 'public', 'data', 'california-codes-content.json');
const VERBOSE = process.argv.includes('--verbose');

// Comprehensive California code sections relevant to Bay Navigator users
// Covers: tenant rights, employment, benefits, family, vehicles, healthcare, education
// Format: { code, sections: [{ num, title, keywords }] }
const SECTIONS_TO_SCRAPE = [
  // ================================================================
  // CIVIL CODE - Tenant Rights, Consumer Protection, Contracts
  // ================================================================
  {
    code: 'CIV',
    name: 'Civil Code',
    sections: [
      // Tenant Rights (most common questions)
      { num: '1940', title: 'Application of tenant law', keywords: ['tenant', 'rental', 'lease'] },
      {
        num: '1940.2',
        title: 'Landlord entry requirements',
        keywords: ['landlord entry', 'notice', 'privacy'],
      },
      {
        num: '1940.3',
        title: 'Immigration status - tenant protection',
        keywords: ['immigration', 'tenant', 'status'],
      },
      {
        num: '1940.35',
        title: 'Bed bugs - landlord responsibility',
        keywords: ['bed bugs', 'pest', 'infestation'],
      },
      {
        num: '1941',
        title: 'Habitability requirements',
        keywords: ['habitability', 'repairs', 'livable'],
      },
      {
        num: '1941.1',
        title: 'Untenantable dwelling conditions',
        keywords: ['uninhabitable', 'conditions', 'repairs'],
      },
      { num: '1941.2', title: 'Tenant caused conditions', keywords: ['tenant damage', 'repairs'] },
      {
        num: '1941.3',
        title: 'Deadbolt locks required',
        keywords: ['locks', 'security', 'deadbolt'],
      },
      { num: '1942', title: 'Tenant remedy for breach', keywords: ['repair', 'deduct', 'remedy'] },
      {
        num: '1942.4',
        title: 'Rent withholding for violations',
        keywords: ['rent withhold', 'habitability'],
      },
      {
        num: '1942.5',
        title: 'Retaliation prohibited',
        keywords: ['retaliation', 'eviction', 'complaint'],
      },
      {
        num: '1946',
        title: 'Notice to terminate tenancy',
        keywords: ['notice', 'terminate', 'end lease'],
      },
      {
        num: '1946.1',
        title: 'Domestic violence - lease termination',
        keywords: ['domestic violence', 'lease', 'terminate'],
      },
      {
        num: '1946.2',
        title: 'Just cause eviction (AB 1482)',
        keywords: ['just cause', 'eviction', 'AB 1482'],
      },
      {
        num: '1946.7',
        title: 'Victims of violence - early termination',
        keywords: ['victim', 'violence', 'terminate'],
      },
      {
        num: '1947.12',
        title: 'Rent cap (AB 1482)',
        keywords: ['rent cap', 'rent increase', 'AB 1482'],
      },
      {
        num: '1947.3',
        title: 'Electronic rent payment',
        keywords: ['rent payment', 'electronic', 'cash'],
      },
      {
        num: '1950.5',
        title: 'Security deposit rules',
        keywords: ['security deposit', 'refund', 'deductions'],
      },
      { num: '1950.7', title: 'Last month rent as deposit', keywords: ['last month', 'deposit'] },
      {
        num: '1951.2',
        title: 'Landlord remedies for abandonment',
        keywords: ['abandonment', 'abandoned'],
      },
      {
        num: '1954',
        title: 'Landlord right of access',
        keywords: ['landlord access', 'entry', '24 hours'],
      },
      {
        num: '1961',
        title: 'Rent increase notice - mobilehomes',
        keywords: ['mobilehome', 'rent increase'],
      },
      {
        num: '1962',
        title: 'Required lease disclosures',
        keywords: ['disclosure', 'lease', 'landlord'],
      },
      {
        num: '1962.7',
        title: 'Lead paint disclosure',
        keywords: ['lead paint', 'disclosure', 'hazard'],
      },
      // Consumer Protection
      {
        num: '1750',
        title: 'Consumer Legal Remedies Act',
        keywords: ['consumer', 'fraud', 'deceptive'],
      },
      {
        num: '1770',
        title: 'Unlawful business practices',
        keywords: ['unfair', 'business', 'consumer'],
      },
      { num: '1780', title: 'Consumer damages', keywords: ['consumer', 'damages', 'remedy'] },
      {
        num: '1788',
        title: 'Debt collection practices',
        keywords: ['debt collector', 'collection', 'harassment'],
      },
      {
        num: '1788.10',
        title: 'Debt collector prohibited practices',
        keywords: ['debt', 'harassment', 'threats'],
      },
      {
        num: '1788.17',
        title: 'Statute of limitations - debt',
        keywords: ['debt', 'statute of limitations', 'old debt'],
      },
      {
        num: '1789.3',
        title: 'Consumer complaint notice',
        keywords: ['complaint', 'consumer affairs'],
      },
      // Identity Theft
      {
        num: '1798.92',
        title: 'Identity theft - definition',
        keywords: ['identity theft', 'fraud'],
      },
      {
        num: '1798.93',
        title: 'Identity theft rights',
        keywords: ['identity theft', 'rights', 'victim'],
      },
    ],
  },
  // ================================================================
  // LABOR CODE - Employment, Wages, Workplace Rights
  // ================================================================
  {
    code: 'LAB',
    name: 'Labor Code',
    sections: [
      // Wages and Pay
      { num: '200', title: 'Wages defined', keywords: ['wages', 'definition', 'pay'] },
      {
        num: '201',
        title: 'Final wages - discharge',
        keywords: ['final paycheck', 'fired', 'terminated'],
      },
      {
        num: '202',
        title: 'Final wages - quit',
        keywords: ['final paycheck', 'quit', 'resignation'],
      },
      {
        num: '203',
        title: 'Penalty for late wages',
        keywords: ['waiting time penalty', 'late pay'],
      },
      {
        num: '204',
        title: 'Pay frequency required',
        keywords: ['payday', 'frequency', 'twice monthly'],
      },
      { num: '210', title: 'Wage statement penalties', keywords: ['pay stub', 'penalty'] },
      { num: '218.5', title: 'Attorney fees - wage claims', keywords: ['attorney fees', 'wages'] },
      {
        num: '221',
        title: 'Wage deductions prohibited',
        keywords: ['deductions', 'illegal', 'withhold'],
      },
      { num: '226', title: 'Pay stub requirements', keywords: ['pay stub', 'itemized statement'] },
      {
        num: '226.7',
        title: 'Break violation penalty',
        keywords: ['break', 'penalty', 'meal', 'rest'],
      },
      {
        num: '227.3',
        title: 'Vacation payout required',
        keywords: ['vacation', 'payout', 'accrued'],
      },
      // Minimum Wage & Overtime
      {
        num: '510',
        title: 'Overtime requirements',
        keywords: ['overtime', 'hours', 'time and half'],
      },
      { num: '511', title: 'Alternative workweek', keywords: ['alternative workweek', '4/10'] },
      { num: '512', title: 'Meal periods', keywords: ['meal break', 'lunch', '30 minutes'] },
      { num: '516', title: 'Wage orders', keywords: ['wage order', 'IWC'] },
      {
        num: '558',
        title: 'Overtime for agricultural workers',
        keywords: ['farm', 'agricultural', 'overtime'],
      },
      {
        num: '1182.12',
        title: 'Minimum wage rate',
        keywords: ['minimum wage', 'hourly rate', 'california'],
      },
      { num: '1194', title: 'Minimum wage recovery', keywords: ['minimum wage', 'underpaid'] },
      {
        num: '1194.2',
        title: 'Liquidated damages - minimum wage',
        keywords: ['damages', 'minimum wage'],
      },
      { num: '1197', title: 'Minimum wage requirement', keywords: ['minimum wage', 'hourly rate'] },
      {
        num: '1197.5',
        title: 'Equal pay for equal work',
        keywords: ['equal pay', 'gender', 'wage gap'],
      },
      // Rest Breaks
      {
        num: '226.7',
        title: 'Rest break requirements',
        keywords: ['rest break', '10 minutes', 'break'],
      },
      // Sick Leave
      {
        num: '245.5',
        title: 'Paid sick leave - definitions',
        keywords: ['sick leave', 'definition'],
      },
      {
        num: '246',
        title: 'Paid sick leave accrual',
        keywords: ['sick leave', 'paid sick', 'accrual'],
      },
      {
        num: '246.5',
        title: 'Sick leave - usage rights',
        keywords: ['sick leave', 'use', 'family'],
      },
      {
        num: '247.5',
        title: 'Sick leave notice posting',
        keywords: ['sick leave', 'notice', 'poster'],
      },
      // Workplace Safety
      {
        num: '6310',
        title: 'Whistleblower protection - safety',
        keywords: ['whistleblower', 'safety', 'retaliation'],
      },
      {
        num: '6311',
        title: 'Right to refuse unsafe work',
        keywords: ['unsafe', 'refuse', 'danger'],
      },
      {
        num: '6400',
        title: 'Safe workplace required',
        keywords: ['safe', 'workplace', 'employer'],
      },
      {
        num: '6401.7',
        title: 'Injury prevention program',
        keywords: ['injury', 'prevention', 'safety'],
      },
      // Discrimination & Harassment
      {
        num: '98.6',
        title: 'Retaliation for filing complaint',
        keywords: ['retaliation', 'complaint', 'labor board'],
      },
      {
        num: '1101',
        title: 'Political activities protected',
        keywords: ['political', 'protected', 'activities'],
      },
      {
        num: '1102.5',
        title: 'Whistleblower protection',
        keywords: ['whistleblower', 'retaliation', 'report'],
      },
      // Workers Compensation
      {
        num: '3600',
        title: 'Workers comp liability',
        keywords: ['workers comp', 'injury', 'work'],
      },
      {
        num: '3700',
        title: 'Workers comp insurance required',
        keywords: ['workers comp', 'insurance'],
      },
      {
        num: '5401',
        title: 'Workers comp claim filing',
        keywords: ['workers comp', 'claim', 'file'],
      },
      // Expense Reimbursement
      {
        num: '2802',
        title: 'Expense reimbursement',
        keywords: ['expense', 'reimbursement', 'mileage'],
      },
      // Independent Contractors
      {
        num: '2775',
        title: 'ABC test - employee vs contractor',
        keywords: ['independent contractor', 'employee', 'AB5', 'gig'],
      },
      {
        num: '2776',
        title: 'Business-to-business exemption',
        keywords: ['contractor', 'B2B', 'exemption'],
      },
    ],
  },
  // ================================================================
  // FAMILY CODE - Divorce, Custody, Child Support, Marriage
  // ================================================================
  {
    code: 'FAM',
    name: 'Family Code',
    sections: [
      // Divorce
      {
        num: '2100',
        title: 'Disclosure requirements',
        keywords: ['divorce', 'disclosure', 'assets'],
      },
      {
        num: '2102',
        title: 'Fiduciary duty in divorce',
        keywords: ['divorce', 'fiduciary', 'assets'],
      },
      {
        num: '2104',
        title: 'Preliminary declaration of disclosure',
        keywords: ['disclosure', 'preliminary'],
      },
      { num: '2105', title: 'Final declaration of disclosure', keywords: ['disclosure', 'final'] },
      {
        num: '2107',
        title: 'Penalty for nondisclosure',
        keywords: ['disclosure', 'penalty', 'hide'],
      },
      {
        num: '2310',
        title: 'Grounds for divorce',
        keywords: ['divorce', 'grounds', 'irreconcilable'],
      },
      {
        num: '2339',
        title: 'Six month waiting period',
        keywords: ['divorce', 'waiting period', '6 months'],
      },
      {
        num: '2550',
        title: 'Equal division of property',
        keywords: ['divorce', 'property', 'divide'],
      },
      {
        num: '2610',
        title: 'Retirement benefits division',
        keywords: ['retirement', 'pension', 'divorce'],
      },
      // Child Custody
      { num: '3002', title: 'Joint custody defined', keywords: ['joint custody', 'definition'] },
      { num: '3003', title: 'Joint physical custody', keywords: ['joint physical', 'custody'] },
      {
        num: '3004',
        title: 'Joint legal custody',
        keywords: ['joint legal', 'custody', 'decisions'],
      },
      {
        num: '3010',
        title: 'Custody rights of parents',
        keywords: ['custody', 'rights', 'parent'],
      },
      {
        num: '3011',
        title: 'Best interest factors',
        keywords: ['best interest', 'factors', 'custody'],
      },
      {
        num: '3020',
        title: 'Best interest of child',
        keywords: ['child custody', 'best interest'],
      },
      { num: '3040', title: 'Custody order priorities', keywords: ['custody', 'parent', 'order'] },
      {
        num: '3041',
        title: 'Custody to non-parent',
        keywords: ['custody', 'grandparent', 'non-parent'],
      },
      {
        num: '3044',
        title: 'Domestic violence - custody presumption',
        keywords: ['domestic violence', 'custody'],
      },
      { num: '3048', title: 'Parenting plan', keywords: ['parenting plan', 'custody'] },
      // Visitation
      { num: '3100', title: 'Visitation rights', keywords: ['visitation', 'parenting time'] },
      { num: '3102', title: 'Grandparent visitation', keywords: ['grandparent', 'visitation'] },
      { num: '3103', title: 'Stepparent visitation', keywords: ['stepparent', 'visitation'] },
      {
        num: '3104',
        title: 'Grandparent petition',
        keywords: ['grandparent', 'petition', 'visitation'],
      },
      // Child Support
      { num: '4001', title: 'Child support duty', keywords: ['child support', 'duty', 'parent'] },
      {
        num: '4053',
        title: 'Child support principles',
        keywords: ['child support', 'guideline', 'principles'],
      },
      {
        num: '4055',
        title: 'Child support calculation',
        keywords: ['child support', 'calculation', 'guideline'],
      },
      {
        num: '4056',
        title: 'Child support add-ons',
        keywords: ['child support', 'childcare', 'health'],
      },
      { num: '4057', title: 'Rebuttable presumption', keywords: ['child support', 'presumption'] },
      { num: '4058', title: 'Income for support', keywords: ['income', 'child support', 'gross'] },
      {
        num: '4062',
        title: 'Additional child support',
        keywords: ['childcare', 'education', 'support'],
      },
      {
        num: '4320',
        title: 'Spousal support factors',
        keywords: ['spousal support', 'alimony', 'factors'],
      },
      // Domestic Violence
      {
        num: '6200',
        title: 'Domestic Violence Prevention Act',
        keywords: ['domestic violence', 'DVPA'],
      },
      {
        num: '6203',
        title: 'Abuse defined',
        keywords: ['abuse', 'domestic violence', 'definition'],
      },
      {
        num: '6211',
        title: 'Domestic violence defined',
        keywords: ['domestic violence', 'definition'],
      },
      {
        num: '6300',
        title: 'Restraining order issuance',
        keywords: ['restraining order', 'protection'],
      },
      {
        num: '6320',
        title: 'Restraining order scope',
        keywords: ['restraining order', 'stay away'],
      },
      {
        num: '6340',
        title: 'Duration of restraining order',
        keywords: ['restraining order', 'duration'],
      },
      // Marriage
      { num: '300', title: 'Who may marry', keywords: ['marriage', 'requirements'] },
      { num: '306', title: 'Domestic partnership', keywords: ['domestic partner', 'registration'] },
      { num: '308', title: 'Confidential marriage', keywords: ['confidential', 'marriage'] },
      { num: '350', title: 'Marriage license', keywords: ['marriage license', 'application'] },
      // Name Change
      { num: '1277', title: 'Child name change', keywords: ['name change', 'child'] },
    ],
  },
  // ================================================================
  // VEHICLE CODE - DMV, Traffic, Licensing
  // ================================================================
  {
    code: 'VEH',
    name: 'Vehicle Code',
    sections: [
      // Registration
      {
        num: '4000',
        title: 'Vehicle registration required',
        keywords: ['registration', 'register', 'dmv'],
      },
      { num: '4000.1', title: 'Smog check required', keywords: ['smog', 'check', 'emissions'] },
      {
        num: '4152.5',
        title: 'Registration renewal',
        keywords: ['registration', 'renewal', 'sticker'],
      },
      { num: '4461', title: 'Disabled placard', keywords: ['disabled', 'placard', 'parking'] },
      { num: '5600', title: 'Certificate of title', keywords: ['title', 'pink slip', 'ownership'] },
      // Licensing
      {
        num: '12500',
        title: 'Driver license required',
        keywords: ['license', 'driving', 'unlicensed'],
      },
      {
        num: '12502',
        title: 'Out of state license',
        keywords: ['out of state', 'license', 'move'],
      },
      { num: '12503', title: 'Carry license while driving', keywords: ['carry', 'license', 'ID'] },
      { num: '12800', title: 'REAL ID', keywords: ['real id', 'federal', 'license'] },
      {
        num: '12801.9',
        title: 'AB60 license (undocumented)',
        keywords: ['AB60', 'undocumented', 'license'],
      },
      { num: '12809', title: 'License renewal', keywords: ['license', 'renewal', 'dmv'] },
      {
        num: '12814.6',
        title: 'Provisional license (teen)',
        keywords: ['provisional', 'teen', 'permit'],
      },
      {
        num: '13353',
        title: 'Implied consent',
        keywords: ['implied consent', 'DUI', 'breathalyzer'],
      },
      {
        num: '13353.2',
        title: 'License suspension - DUI',
        keywords: ['suspension', 'DUI', 'license'],
      },
      {
        num: '14601',
        title: 'Driving on suspended license',
        keywords: ['suspended', 'license', 'driving'],
      },
      {
        num: '14601.1',
        title: 'Driving when license suspended - knowledge',
        keywords: ['suspended', 'knowing'],
      },
      {
        num: '14602.6',
        title: 'Vehicle impound - unlicensed',
        keywords: ['impound', 'tow', 'unlicensed'],
      },
      // Traffic Laws
      { num: '21453', title: 'Red light', keywords: ['red light', 'stop', 'signal'] },
      { num: '21461', title: 'Disobeying signs', keywords: ['sign', 'disobey', 'traffic'] },
      { num: '22101', title: 'U-turn restrictions', keywords: ['u-turn', 'illegal'] },
      { num: '22106', title: 'Unsafe start', keywords: ['unsafe', 'start', 'curb'] },
      { num: '22107', title: 'Unsafe lane change', keywords: ['lane change', 'signal'] },
      { num: '22108', title: 'Turn signal required', keywords: ['turn signal', 'blinker'] },
      { num: '22109', title: 'Sudden stop prohibited', keywords: ['sudden stop', 'brake check'] },
      { num: '22350', title: 'Basic speed law', keywords: ['speed', 'speeding', 'safe'] },
      { num: '22356', title: 'Maximum speed limit', keywords: ['speed limit', 'maximum', '65'] },
      { num: '22400', title: 'Minimum speed', keywords: ['minimum speed', 'slow'] },
      { num: '22450', title: 'Stop sign', keywords: ['stop sign', 'complete stop'] },
      { num: '23103', title: 'Reckless driving', keywords: ['reckless', 'driving'] },
      { num: '23109', title: 'Speed contest (racing)', keywords: ['racing', 'speed contest'] },
      {
        num: '23123',
        title: 'Cell phone - handheld',
        keywords: ['cell phone', 'handheld', 'texting'],
      },
      { num: '23123.5', title: 'Texting while driving', keywords: ['texting', 'driving', 'phone'] },
      // DUI
      {
        num: '23152',
        title: 'DUI - driving under influence',
        keywords: ['dui', 'drunk driving', 'alcohol', 'drugs'],
      },
      { num: '23153', title: 'DUI causing injury', keywords: ['dui', 'injury', 'felony'] },
      { num: '23536', title: 'First DUI penalties', keywords: ['dui', 'first', 'penalty'] },
      { num: '23540', title: 'Second DUI penalties', keywords: ['dui', 'second', 'penalty'] },
      { num: '23546', title: 'Third DUI penalties', keywords: ['dui', 'third', 'penalty'] },
      { num: '23600', title: 'DUI probation', keywords: ['dui', 'probation'] },
      // Hit and Run
      {
        num: '20001',
        title: 'Hit and run - injury',
        keywords: ['hit and run', 'injury', 'felony'],
      },
      {
        num: '20002',
        title: 'Hit and run - property',
        keywords: ['hit and run', 'property', 'damage'],
      },
      // Insurance
      {
        num: '16020',
        title: 'Proof of insurance required',
        keywords: ['insurance', 'proof', 'financial responsibility'],
      },
      { num: '16028', title: 'Insurance evidence', keywords: ['insurance', 'card', 'electronic'] },
      // Accidents
      { num: '20008', title: 'Accident report', keywords: ['accident', 'report', 'police'] },
      {
        num: '16000',
        title: 'Report accident to DMV',
        keywords: ['accident', 'report', 'dmv', 'SR-1'],
      },
    ],
  },
  // ================================================================
  // UNEMPLOYMENT INSURANCE CODE - EDD, UI, SDI, PFL
  // ================================================================
  {
    code: 'UIC',
    name: 'Unemployment Insurance Code',
    sections: [
      // Unemployment Insurance
      { num: '100', title: 'UI purpose', keywords: ['unemployment', 'purpose'] },
      {
        num: '1251',
        title: 'Benefit eligibility - general',
        keywords: ['unemployment', 'eligible', 'qualify'],
      },
      {
        num: '1252',
        title: 'Availability for work',
        keywords: ['available', 'work', 'unemployment'],
      },
      {
        num: '1253',
        title: 'Eligibility requirements',
        keywords: ['unemployment', 'eligible', 'qualify'],
      },
      {
        num: '1253.3',
        title: 'Training benefits',
        keywords: ['training', 'unemployment', 'school'],
      },
      { num: '1255', title: 'Weekly benefit amount', keywords: ['benefit', 'amount', 'weekly'] },
      {
        num: '1256',
        title: 'Disqualification - voluntary quit',
        keywords: ['quit', 'voluntary', 'disqualified'],
      },
      {
        num: '1256.1',
        title: 'Good cause for quitting',
        keywords: ['good cause', 'quit', 'harassment'],
      },
      {
        num: '1257',
        title: 'Disqualification - misconduct',
        keywords: ['fired', 'misconduct', 'disqualified'],
      },
      {
        num: '1260',
        title: 'Disqualification - refusing work',
        keywords: ['refuse', 'work', 'disqualified'],
      },
      { num: '1265', title: 'Base period', keywords: ['base period', 'wages', 'unemployment'] },
      {
        num: '1275',
        title: 'Extended benefits',
        keywords: ['extended', 'benefits', 'unemployment'],
      },
      { num: '1326', title: 'Work search required', keywords: ['work search', 'job search'] },
      { num: '1327', title: 'Suitable work', keywords: ['suitable work', 'refuse'] },
      // State Disability Insurance (SDI)
      { num: '2601', title: 'SDI purpose', keywords: ['disability', 'sdi', 'purpose'] },
      { num: '2625', title: 'SDI benefit period', keywords: ['sdi', 'benefit', 'weeks'] },
      { num: '2626', title: 'SDI weekly benefit', keywords: ['sdi', 'amount', 'weekly'] },
      {
        num: '2627',
        title: 'SDI - disability defined',
        keywords: ['disability', 'definition', 'sdi'],
      },
      { num: '2629', title: 'SDI eligibility', keywords: ['sdi', 'eligible', 'qualify'] },
      { num: '2652', title: 'SDI claim filing', keywords: ['sdi', 'claim', 'file', 'doctor'] },
      {
        num: '2653',
        title: 'SDI seven-day waiting period',
        keywords: ['sdi', 'waiting period', '7 days'],
      },
      {
        num: '2656',
        title: 'SDI - pregnancy',
        keywords: ['pregnancy', 'disability', 'sdi', 'maternity'],
      },
      // Paid Family Leave (PFL)
      { num: '3300', title: 'PFL purpose', keywords: ['pfl', 'family leave', 'purpose'] },
      {
        num: '3301',
        title: 'PFL eligibility',
        keywords: ['pfl', 'family leave', 'bonding', 'care'],
      },
      { num: '3302', title: 'PFL definitions', keywords: ['pfl', 'family', 'definition'] },
      { num: '3303', title: 'PFL benefit amount', keywords: ['pfl', 'amount', 'benefit'] },
      { num: '3303.1', title: 'PFL duration - 8 weeks', keywords: ['pfl', 'weeks', 'duration'] },
      {
        num: '3307',
        title: 'PFL for military family',
        keywords: ['pfl', 'military', 'deployment'],
      },
    ],
  },
  // ================================================================
  // WELFARE AND INSTITUTIONS CODE - CalFresh, CalWORKs, Medi-Cal
  // ================================================================
  {
    code: 'WIC',
    name: 'Welfare and Institutions Code',
    sections: [
      // CalWORKs (Cash Aid)
      { num: '11200', title: 'CalWORKs program', keywords: ['calworks', 'welfare', 'cash aid'] },
      {
        num: '11250',
        title: 'CalWORKs eligibility',
        keywords: ['calworks', 'tanf', 'cash aid', 'eligible'],
      },
      {
        num: '11253',
        title: 'CalWORKs - income limits',
        keywords: ['calworks', 'income', 'limit'],
      },
      {
        num: '11253.4',
        title: 'CalWORKs - resource limits',
        keywords: ['calworks', 'resources', 'assets'],
      },
      {
        num: '11320.3',
        title: 'CalWORKs - welfare to work',
        keywords: ['calworks', 'welfare to work', 'WTW'],
      },
      {
        num: '11322.6',
        title: 'CalWORKs - good cause exemption',
        keywords: ['calworks', 'exemption', 'good cause'],
      },
      {
        num: '11322.8',
        title: 'CalWORKs - domestic violence exemption',
        keywords: ['calworks', 'domestic violence'],
      },
      {
        num: '11450',
        title: 'CalWORKs grant amounts',
        keywords: ['calworks', 'grant', 'amount', 'payment'],
      },
      {
        num: '11451',
        title: 'CalWORKs - earned income disregard',
        keywords: ['calworks', 'income', 'disregard'],
      },
      {
        num: '11454',
        title: 'CalWORKs - housing supplement',
        keywords: ['calworks', 'housing', 'homeless'],
      },
      { num: '11461', title: 'Foster care rates', keywords: ['foster care', 'payment', 'rate'] },
      { num: '11462', title: 'Group home rates', keywords: ['group home', 'foster', 'rate'] },
      // CalFresh (Food Stamps/SNAP)
      { num: '18900', title: 'CalFresh program', keywords: ['calfresh', 'food stamps', 'snap'] },
      {
        num: '18901',
        title: 'CalFresh eligibility',
        keywords: ['calfresh', 'food stamps', 'snap', 'eligible'],
      },
      {
        num: '18901.5',
        title: 'CalFresh - students',
        keywords: ['calfresh', 'student', 'college'],
      },
      {
        num: '18904',
        title: 'CalFresh - application processing',
        keywords: ['calfresh', 'application', '30 days'],
      },
      {
        num: '18904.25',
        title: 'CalFresh - expedited services',
        keywords: ['calfresh', 'emergency', 'expedited'],
      },
      { num: '18910', title: 'CalFresh benefits', keywords: ['calfresh', 'benefits', 'EBT'] },
      { num: '18930', title: 'CalFresh - SSI cash-out', keywords: ['calfresh', 'ssi', 'cash out'] },
      // Medi-Cal
      { num: '14000', title: 'Medi-Cal program', keywords: ['medi-cal', 'medicaid', 'health'] },
      { num: '14005.4', title: 'Medi-Cal - income', keywords: ['medi-cal', 'income', 'limit'] },
      {
        num: '14005.40',
        title: 'Medi-Cal - ACA expansion',
        keywords: ['medi-cal', 'expansion', 'ACA'],
      },
      {
        num: '14005.64',
        title: 'Medi-Cal - immigrants',
        keywords: ['medi-cal', 'immigrant', 'undocumented'],
      },
      {
        num: '14007.5',
        title: 'Medi-Cal - no wrong door',
        keywords: ['medi-cal', 'application', 'enrollment'],
      },
      {
        num: '14007.8',
        title: 'Medi-Cal - express lane',
        keywords: ['medi-cal', 'automatic', 'enrollment'],
      },
      {
        num: '14011',
        title: 'Medi-Cal covered services',
        keywords: ['medi-cal', 'covered', 'services'],
      },
      {
        num: '14105.3',
        title: 'Medi-Cal - provider rates',
        keywords: ['medi-cal', 'provider', 'rate'],
      },
      {
        num: '14124.70',
        title: 'Medi-Cal - estate recovery',
        keywords: ['medi-cal', 'estate', 'recovery', 'payback'],
      },
      {
        num: '14131',
        title: 'Medi-Cal managed care',
        keywords: ['medi-cal', 'managed care', 'HMO'],
      },
      // General Assistance
      {
        num: '17000',
        title: 'General Assistance - county duty',
        keywords: ['general assistance', 'GA', 'county'],
      },
      {
        num: '17001',
        title: 'General Assistance eligibility',
        keywords: ['general assistance', 'eligible'],
      },
      // Child Welfare
      {
        num: '300',
        title: 'Dependency jurisdiction',
        keywords: ['child welfare', 'dependency', 'CPS'],
      },
      { num: '309', title: 'Child removal', keywords: ['CPS', 'removal', 'custody'] },
      { num: '319', title: 'Detention hearing', keywords: ['detention', 'hearing', 'dependency'] },
      {
        num: '361',
        title: 'Removal findings',
        keywords: ['removal', 'dependency', 'reasonable efforts'],
      },
      {
        num: '366.21',
        title: 'Reunification services',
        keywords: ['reunification', 'services', 'foster'],
      },
      {
        num: '366.26',
        title: 'Termination of parental rights',
        keywords: ['TPR', 'adoption', 'parental rights'],
      },
      // Adult Protective Services
      { num: '15600', title: 'Elder abuse defined', keywords: ['elder abuse', 'definition'] },
      {
        num: '15610',
        title: 'Elder abuse types',
        keywords: ['elder abuse', 'financial', 'physical', 'neglect'],
      },
      { num: '15630', title: 'Mandated reporters', keywords: ['mandated reporter', 'elder abuse'] },
      {
        num: '15656',
        title: 'Adult Protective Services',
        keywords: ['APS', 'adult protective', 'elder'],
      },
    ],
  },
  // ================================================================
  // HEALTH AND SAFETY CODE - Medi-Cal, Cannabis, Housing
  // ================================================================
  {
    code: 'HSC',
    name: 'Health and Safety Code',
    sections: [
      // Cannabis
      {
        num: '11357',
        title: 'Marijuana possession',
        keywords: ['marijuana', 'cannabis', 'possession'],
      },
      {
        num: '11358',
        title: 'Marijuana cultivation',
        keywords: ['marijuana', 'cannabis', 'grow', 'cultivate'],
      },
      {
        num: '11359',
        title: 'Marijuana possession for sale',
        keywords: ['marijuana', 'cannabis', 'sale'],
      },
      {
        num: '11360',
        title: 'Marijuana transportation',
        keywords: ['marijuana', 'cannabis', 'transport'],
      },
      {
        num: '11361.8',
        title: 'Marijuana conviction resentencing',
        keywords: ['marijuana', 'resentencing', 'prop 64'],
      },
      {
        num: '11362.1',
        title: 'Adult use cannabis (Prop 64)',
        keywords: ['cannabis', 'prop 64', 'legal', 'recreational'],
      },
      {
        num: '11362.2',
        title: 'Personal cannabis cultivation',
        keywords: ['cannabis', 'grow', 'home', 'personal'],
      },
      {
        num: '11362.3',
        title: 'Cannabis restrictions',
        keywords: ['cannabis', 'public', 'smoking', 'driving'],
      },
      {
        num: '11362.45',
        title: 'Employer cannabis rights',
        keywords: ['cannabis', 'employer', 'workplace', 'drug test'],
      },
      {
        num: '11362.5',
        title: 'Medical marijuana (Prop 215)',
        keywords: ['medical marijuana', 'prop 215', 'patient'],
      },
      {
        num: '11362.71',
        title: 'Medical marijuana ID card',
        keywords: ['medical marijuana', 'card', 'ID'],
      },
      // Housing Standards
      {
        num: '17920.3',
        title: 'Substandard building defined',
        keywords: ['substandard', 'building', 'housing'],
      },
      {
        num: '17920.10',
        title: 'Overcrowding',
        keywords: ['overcrowding', 'occupancy', 'housing'],
      },
      { num: '17958', title: 'Building standards', keywords: ['building', 'code', 'standards'] },
      {
        num: '17973',
        title: 'Rent withholding notice',
        keywords: ['rent', 'withhold', 'habitability'],
      },
      // Lead Paint
      {
        num: '17920.10',
        title: 'Lead paint hazard',
        keywords: ['lead', 'paint', 'hazard', 'child'],
      },
      {
        num: '105250',
        title: 'Lead poisoning prevention',
        keywords: ['lead', 'poisoning', 'child', 'blood'],
      },
      // Mold
      { num: '26147', title: 'Mold disclosure', keywords: ['mold', 'disclosure', 'toxic'] },
    ],
  },
  // ================================================================
  // GOVERNMENT CODE - Public Records, Whistleblower, Employment
  // ================================================================
  {
    code: 'GOV',
    name: 'Government Code',
    sections: [
      // Public Records Act
      {
        num: '6250',
        title: 'Public records - purpose',
        keywords: ['public records', 'CPRA', 'transparency'],
      },
      { num: '6252', title: 'Public records defined', keywords: ['public records', 'definition'] },
      {
        num: '6253',
        title: 'Right to inspect records',
        keywords: ['public records', 'inspect', 'access'],
      },
      {
        num: '6253.1',
        title: 'Response time - 10 days',
        keywords: ['public records', 'response', 'time'],
      },
      { num: '6254', title: 'Exempt records', keywords: ['public records', 'exempt', 'private'] },
      { num: '6259', title: 'Court enforcement', keywords: ['public records', 'lawsuit', 'court'] },
      // Open Meetings (Brown Act)
      {
        num: '54950',
        title: 'Brown Act - purpose',
        keywords: ['brown act', 'open meeting', 'public'],
      },
      { num: '54953', title: 'Meeting requirements', keywords: ['meeting', 'public', 'notice'] },
      { num: '54954.2', title: 'Agenda posting', keywords: ['agenda', 'posting', '72 hours'] },
      {
        num: '54957',
        title: 'Closed session',
        keywords: ['closed session', 'executive', 'private'],
      },
      // FEHA - Fair Employment
      {
        num: '12900',
        title: 'FEHA purpose',
        keywords: ['FEHA', 'discrimination', 'fair employment'],
      },
      {
        num: '12920',
        title: 'Employment discrimination prohibited',
        keywords: ['discrimination', 'employment', 'FEHA'],
      },
      {
        num: '12926',
        title: 'Protected categories',
        keywords: ['protected class', 'race', 'religion', 'disability', 'age'],
      },
      {
        num: '12940',
        title: 'Unlawful employment practices',
        keywords: ['discrimination', 'harassment', 'retaliation'],
      },
      {
        num: '12945',
        title: 'Pregnancy discrimination',
        keywords: ['pregnancy', 'discrimination', 'leave'],
      },
      {
        num: '12945.2',
        title: 'CFRA family leave',
        keywords: ['CFRA', 'family leave', 'FMLA', 'california'],
      },
      {
        num: '12945.6',
        title: 'New parent leave',
        keywords: ['parental leave', 'new parent', 'baby bonding'],
      },
      {
        num: '12950',
        title: 'Sexual harassment training',
        keywords: ['sexual harassment', 'training', 'employer'],
      },
      {
        num: '12950.1',
        title: 'Harassment prevention training',
        keywords: ['harassment', 'training', 'required'],
      },
      // Whistleblower
      {
        num: '8547',
        title: 'State employee whistleblower',
        keywords: ['whistleblower', 'state employee', 'report'],
      },
      {
        num: '8547.2',
        title: 'Whistleblower protection',
        keywords: ['whistleblower', 'retaliation', 'protection'],
      },
      {
        num: '53296',
        title: 'Local government whistleblower',
        keywords: ['whistleblower', 'local', 'city', 'county'],
      },
      // Jury Duty
      {
        num: '68097',
        title: 'Jury duty - employer protection',
        keywords: ['jury duty', 'employer', 'time off'],
      },
    ],
  },
  // ================================================================
  // EDUCATION CODE - Financial Aid, Student Rights
  // ================================================================
  {
    code: 'EDC',
    name: 'Education Code',
    sections: [
      // Cal Grant / Financial Aid
      {
        num: '69430',
        title: 'Cal Grant program',
        keywords: ['cal grant', 'financial aid', 'college'],
      },
      { num: '69432', title: 'Cal Grant eligibility', keywords: ['cal grant', 'eligible', 'GPA'] },
      { num: '69433', title: 'Cal Grant types', keywords: ['cal grant', 'type A', 'type B'] },
      { num: '69433.6', title: 'Cal Grant C', keywords: ['cal grant C', 'vocational', 'career'] },
      {
        num: '69435',
        title: 'Cal Grant application',
        keywords: ['cal grant', 'application', 'deadline'],
      },
      {
        num: '69439.9',
        title: 'California Dream Act',
        keywords: ['dream act', 'undocumented', 'financial aid', 'AB540'],
      },
      // Student Rights
      {
        num: '48900',
        title: 'Grounds for suspension',
        keywords: ['suspension', 'expulsion', 'discipline', 'student'],
      },
      {
        num: '48911',
        title: 'Suspension procedure',
        keywords: ['suspension', 'procedure', 'due process'],
      },
      {
        num: '48915',
        title: 'Expulsion required',
        keywords: ['expulsion', 'mandatory', 'weapons'],
      },
      {
        num: '48915.5',
        title: 'Expulsion procedure',
        keywords: ['expulsion', 'hearing', 'procedure'],
      },
      { num: '48918', title: 'Expulsion hearing', keywords: ['expulsion', 'hearing', 'appeal'] },
      // AB540 / Undocumented Students
      {
        num: '68130.5',
        title: 'AB540 - in-state tuition',
        keywords: ['AB540', 'undocumented', 'in-state', 'tuition'],
      },
      // Adult Education
      {
        num: '52500',
        title: 'Adult education programs',
        keywords: ['adult education', 'GED', 'high school'],
      },
      {
        num: '52501',
        title: 'Adult education types',
        keywords: ['adult education', 'ESL', 'citizenship'],
      },
      // Special Education
      {
        num: '56000',
        title: 'Special education purpose',
        keywords: ['special education', 'IEP', 'IDEA'],
      },
      {
        num: '56026',
        title: 'Individual with disability defined',
        keywords: ['disability', 'special education', 'definition'],
      },
      {
        num: '56040',
        title: 'Right to free education',
        keywords: ['FAPE', 'free', 'special education'],
      },
      { num: '56341', title: 'IEP team', keywords: ['IEP', 'team', 'meeting'] },
      { num: '56345', title: 'IEP contents', keywords: ['IEP', 'goals', 'services'] },
      {
        num: '56500',
        title: 'Procedural safeguards',
        keywords: ['special education', 'rights', 'procedural'],
      },
      // Homeless Students
      {
        num: '48850',
        title: 'Homeless student definition',
        keywords: ['homeless', 'student', 'McKinney-Vento'],
      },
      {
        num: '48852.5',
        title: 'Homeless student rights',
        keywords: ['homeless', 'student', 'enrollment', 'transportation'],
      },
      // Free Meals
      {
        num: '49501',
        title: 'Free and reduced meals',
        keywords: ['free lunch', 'reduced', 'school meals'],
      },
      {
        num: '49557.5',
        title: 'Universal meals',
        keywords: ['universal meals', 'free lunch', 'all students'],
      },
    ],
  },
  // ================================================================
  // CODE OF CIVIL PROCEDURE - Small Claims, Eviction Process
  // ================================================================
  {
    code: 'CCP',
    name: 'Code of Civil Procedure',
    sections: [
      // Small Claims
      { num: '116.110', title: 'Small claims purpose', keywords: ['small claims', 'purpose'] },
      {
        num: '116.220',
        title: 'Small claims jurisdiction',
        keywords: ['small claims', 'limit', '$12,500'],
      },
      {
        num: '116.230',
        title: 'Who can sue in small claims',
        keywords: ['small claims', 'plaintiff'],
      },
      {
        num: '116.310',
        title: 'Where to file small claims',
        keywords: ['small claims', 'venue', 'where'],
      },
      {
        num: '116.330',
        title: 'Small claims filing fee',
        keywords: ['small claims', 'fee', 'cost'],
      },
      {
        num: '116.340',
        title: 'Service of small claims',
        keywords: ['small claims', 'serve', 'service'],
      },
      {
        num: '116.520',
        title: 'Small claims hearing',
        keywords: ['small claims', 'hearing', 'trial'],
      },
      {
        num: '116.610',
        title: 'Small claims judgment',
        keywords: ['small claims', 'judgment', 'decision'],
      },
      { num: '116.710', title: 'Small claims appeal', keywords: ['small claims', 'appeal'] },
      {
        num: '116.810',
        title: 'Enforcing small claims judgment',
        keywords: ['small claims', 'collect', 'enforce'],
      },
      // Unlawful Detainer (Eviction)
      {
        num: '1161',
        title: 'Grounds for eviction',
        keywords: ['eviction', 'unlawful detainer', 'grounds'],
      },
      {
        num: '1161.1',
        title: 'Tenant foreclosure rights',
        keywords: ['foreclosure', 'tenant', 'eviction'],
      },
      { num: '1162', title: 'Eviction notice service', keywords: ['eviction', 'notice', 'serve'] },
      {
        num: '1166',
        title: 'Eviction lawsuit',
        keywords: ['eviction', 'unlawful detainer', 'complaint'],
      },
      {
        num: '1167',
        title: 'Eviction response time',
        keywords: ['eviction', 'answer', 'response', '5 days'],
      },
      {
        num: '1170.5',
        title: 'Eviction stay of execution',
        keywords: ['eviction', 'stay', 'hardship'],
      },
      {
        num: '1174',
        title: 'Lockout after judgment',
        keywords: ['eviction', 'lockout', 'sheriff'],
      },
      // Statute of Limitations
      {
        num: '335.1',
        title: 'Statute of limitations - personal injury',
        keywords: ['statute of limitations', 'personal injury', '2 years'],
      },
      {
        num: '337',
        title: 'Statute of limitations - contract',
        keywords: ['statute of limitations', 'contract', '4 years'],
      },
      {
        num: '338',
        title: 'Statute of limitations - property damage',
        keywords: ['statute of limitations', 'property', '3 years'],
      },
      {
        num: '339',
        title: 'Statute of limitations - oral contract',
        keywords: ['statute of limitations', 'oral', '2 years'],
      },
      {
        num: '340.5',
        title: 'Statute of limitations - medical malpractice',
        keywords: ['statute of limitations', 'malpractice', '3 years'],
      },
      // Debt Collection
      { num: '683.010', title: 'Judgment renewal', keywords: ['judgment', 'renew', '10 years'] },
      { num: '695.010', title: 'Judgment lien', keywords: ['judgment', 'lien', 'property'] },
      {
        num: '697.510',
        title: 'Wage garnishment exemption',
        keywords: ['garnishment', 'wages', 'exempt'],
      },
      {
        num: '703.010',
        title: 'Property exemptions',
        keywords: ['exempt', 'property', 'collection'],
      },
      { num: '704.070', title: 'Earnings exemption', keywords: ['wages', 'exempt', 'garnishment'] },
      { num: '704.710', title: 'Homestead exemption', keywords: ['homestead', 'house', 'exempt'] },
    ],
  },
  // ================================================================
  // PENAL CODE - Common Criminal Issues
  // ================================================================
  {
    code: 'PEN',
    name: 'Penal Code',
    sections: [
      // Misdemeanors
      { num: '148', title: 'Resisting arrest', keywords: ['resisting', 'arrest', 'obstruction'] },
      { num: '243', title: 'Battery', keywords: ['battery', 'assault', 'hit'] },
      {
        num: '415',
        title: 'Disturbing the peace',
        keywords: ['disturbing peace', 'noise', 'fight'],
      },
      { num: '459', title: 'Burglary', keywords: ['burglary', 'break in', 'enter'] },
      { num: '484', title: 'Theft defined', keywords: ['theft', 'steal', 'larceny'] },
      { num: '487', title: 'Grand theft', keywords: ['grand theft', 'felony', '$950'] },
      { num: '488', title: 'Petty theft', keywords: ['petty theft', 'misdemeanor', 'shoplifting'] },
      {
        num: '490.2',
        title: 'Shoplifting (Prop 47)',
        keywords: ['shoplifting', 'prop 47', 'misdemeanor'],
      },
      {
        num: '496',
        title: 'Receiving stolen property',
        keywords: ['stolen', 'receiving', 'property'],
      },
      { num: '602', title: 'Trespassing', keywords: ['trespass', 'property', 'enter'] },
      {
        num: '647',
        title: 'Disorderly conduct',
        keywords: ['disorderly', 'public', 'prostitution', 'drunk'],
      },
      // Domestic Violence
      {
        num: '136.2',
        title: 'Protective order - criminal',
        keywords: ['protective order', 'criminal', 'DV'],
      },
      { num: '243', title: 'Domestic battery', keywords: ['domestic', 'battery', 'spouse'] },
      {
        num: '273.5',
        title: 'Corporal injury to spouse',
        keywords: ['domestic violence', 'injury', 'spouse'],
      },
      {
        num: '273.6',
        title: 'Violation of protective order',
        keywords: ['protective order', 'violation'],
      },
      { num: '646.9', title: 'Stalking', keywords: ['stalking', 'harassment', 'follow'] },
      // Record Clearing
      {
        num: '1203.4',
        title: 'Expungement - probation',
        keywords: ['expungement', 'clean record', 'dismiss', 'probation'],
      },
      {
        num: '1203.4a',
        title: 'Expungement - no probation',
        keywords: ['expungement', 'misdemeanor', 'infraction'],
      },
      {
        num: '1203.41',
        title: 'Expungement - felony (realignment)',
        keywords: ['expungement', 'felony', 'AB109'],
      },
      {
        num: '1203.42',
        title: 'Expungement - completion certificate',
        keywords: ['expungement', 'certificate'],
      },
      {
        num: '1203.45',
        title: 'Sealing juvenile record',
        keywords: ['juvenile', 'seal', 'record'],
      },
      {
        num: '1170.18',
        title: 'Prop 47 resentencing',
        keywords: ['prop 47', 'resentencing', 'felony', 'misdemeanor'],
      },
      {
        num: '1170.91',
        title: 'Veteran resentencing',
        keywords: ['veteran', 'resentencing', 'PTSD', 'military'],
      },
      // Prop 47 Crimes
      {
        num: '459.5',
        title: 'Shoplifting (Prop 47)',
        keywords: ['shoplifting', 'prop 47', '$950'],
      },
      { num: '473', title: 'Forgery (Prop 47)', keywords: ['forgery', 'check', 'prop 47'] },
      { num: '476a', title: 'Bad check (Prop 47)', keywords: ['bad check', 'NSF', 'prop 47'] },
      // Prop 64 Cannabis Resentencing
      {
        num: '1170.82',
        title: 'Cannabis resentencing',
        keywords: ['cannabis', 'marijuana', 'resentencing', 'prop 64'],
      },
      // Bail
      { num: '1269b', title: 'Bail schedule', keywords: ['bail', 'schedule', 'amount'] },
      {
        num: '1270',
        title: 'Release on own recognizance',
        keywords: ['OR release', 'own recognizance', 'bail'],
      },
      { num: '1275', title: 'Bail factors', keywords: ['bail', 'factors', 'flight risk'] },
    ],
  },
];

// Base URL for California Legislature
const BASE_URL = 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml';

/**
 * Fetch a URL with timeout
 */
function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'BayNavigator/1.0 (California Codes Sync)',
          Accept: 'text/html',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Extract code section text from HTML
 */
function extractSectionText(html) {
  // Find content between <p> tags in the code section
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = pRegex.exec(html)) !== null) {
    let text = match[1]
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 10) {
      paragraphs.push(text);
    }
  }

  return paragraphs.join('\n\n');
}

/**
 * Scrape a single code section
 */
async function scrapeSection(code, sectionNum) {
  const url = `${BASE_URL}?lawCode=${code}&sectionNum=${sectionNum}`;

  try {
    const html = await fetchUrl(url);
    const text = extractSectionText(html);

    if (!text || text.length < 50) {
      return null;
    }

    return {
      code,
      section: sectionNum,
      url,
      text: text.substring(0, 5000), // Cap at 5000 chars per section
      scraped: new Date().toISOString(),
    };
  } catch (error) {
    if (VERBOSE) console.log(`    ⚠️ ${code} ${sectionNum}: ${error.message}`);
    return null;
  }
}

/**
 * Main sync function
 */
async function syncCaliforniaCodes() {
  console.log('🔄 Syncing California state codes content...\n');

  const cache = {
    generated: new Date().toISOString(),
    source: 'California Legislature (leginfo.legislature.ca.gov)',
    description:
      'Actual text content from California state codes for commonly-asked legal questions',
    codes: {},
    sections: [],
    byKeyword: {},
  };

  let successCount = 0;
  let failCount = 0;

  for (const codeGroup of SECTIONS_TO_SCRAPE) {
    console.log(`  📚 ${codeGroup.name} (${codeGroup.code})`);

    cache.codes[codeGroup.code] = {
      name: codeGroup.name,
      sections: [],
    };

    for (const section of codeGroup.sections) {
      if (VERBOSE) console.log(`    Fetching ${codeGroup.code} §${section.num}...`);

      const result = await scrapeSection(codeGroup.code, section.num);

      if (result) {
        const sectionData = {
          ...result,
          title: section.title,
          keywords: section.keywords,
        };

        cache.sections.push(sectionData);
        cache.codes[codeGroup.code].sections.push(sectionData);

        // Index by keywords
        for (const keyword of section.keywords) {
          const kw = keyword.toLowerCase();
          if (!cache.byKeyword[kw]) cache.byKeyword[kw] = [];
          cache.byKeyword[kw].push({
            code: codeGroup.code,
            section: section.num,
            title: section.title,
          });
        }

        console.log(`    ✅ §${section.num}: ${section.title} (${result.text.length} chars)`);
        successCount++;
      } else {
        console.log(`    ❌ §${section.num}: ${section.title}`);
        failCount++;
      }

      // Be nice to the server
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Calculate totals
  cache.totals = {
    codes: Object.keys(cache.codes).length,
    sections: cache.sections.length,
    keywords: Object.keys(cache.byKeyword).length,
    totalChars: cache.sections.reduce((sum, s) => sum + s.text.length, 0),
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write cache file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cache, null, 2));

  const fileSizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);

  console.log(`
📊 Sync Complete
   Sections scraped: ${successCount} succeeded, ${failCount} failed
   Total codes: ${cache.totals.codes}
   Total sections: ${cache.totals.sections}
   Total keywords indexed: ${cache.totals.keywords}
   Content size: ${Math.round(cache.totals.totalChars / 1024)} KB of legal text
   File size: ${fileSizeKB} KB
   Output: ${OUTPUT_FILE}
`);

  return { successCount, failCount };
}

// Run if called directly
if (require.main === module) {
  syncCaliforniaCodes()
    .then(({ failCount }) => {
      process.exit(failCount > 10 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncCaliforniaCodes };
