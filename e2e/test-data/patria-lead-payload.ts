/**
 * Patria leads API — payload builder.
 *
 * Used by:
 *   - patria-contract.spec.ts (happy path: valid lead → 201)
 *   - patria-negative.spec.ts (auth + bad payload rejection)
 *
 * Shape matches the API contract used in Postman / UAT.
 * Overrides: email (unique per run), ssnNumber, loanAmount, monthlyIncome.
 * Dates are generated dynamically (next Friday, +14 days) to avoid stale values.
 */

/** Format date as YYYY/MM/DD for API. */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/** Next Friday from today. If today is Friday, returns next week's Friday. */
export function getNextPayDate(): string {
  const today = new Date();
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  return formatDate(nextFriday);
}

/** nextPayDate + 14 days (biweekly). */
export function getSecondPayDate(): string {
  const next = getNextPayDate();
  const [y, m, day] = next.split('/').map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + 14);
  return formatDate(d);
}

export interface PatriaLeadPayloadOverrides {
  email?: string;
  ssnNumber?: string;
  loanAmount?: string;
  monthlyIncome?: string;
}

/** Defaults for contract test: known-good accepted lead (SSN 100000001). */
const DEFAULT_OVERRIDES: Omit<Required<PatriaLeadPayloadOverrides>, 'email'> = {
  ssnNumber: '100000001',
  loanAmount: '1200',
  monthlyIncome: '5500',
};

export interface PatriaLeadPayload {
  campaignKey: string;
  clientIP: string;
  loanAmount: string;
  refererURL: string;
  personalInformation: {
    firstName: string;
    lastName: string;
    birthday: string;
    address: {
      zipCode: string;
      city: string;
      state: string;
      street: string;
      monthsAtAddress: string;
    };
    email: string;
    homeOwnership: string;
    driversLicense: string;
    driversLicenseState: string;
    cellPhone: string;
    homePhone: string;
    ssnNumber: string;
    military: string;
  };
  employmentInformation: {
    incomeType: string;
    employerName: string;
    monthsEmployed: string;
    zipCode: string;
    monthlyIncome: string;
    payFrequency: string;
    nextPayDate: string;
    secondPayDate: string;
    employerPhone: string;
    payType: string;
  };
  bankInformation: {
    bankRoutingNumber: string;
    bankAccountNumber: string;
    bankName: string;
    bankAccountType: string;
    monthsAtBank: string;
  };
  leadProvider: string;
  vendor: { autoImport: boolean };
}

/**
 * Builds a valid lead payload for Patria. Matches Postman/API contract.
 * Use overrides for email (unique), ssnNumber, loanAmount, monthlyIncome.
 */
export function buildValidLeadPayload(overrides: PatriaLeadPayloadOverrides = {}): PatriaLeadPayload {
  const o = { ...DEFAULT_OVERRIDES, ...overrides };
  const email = overrides.email ?? `fpratichi+${Date.now()}@businesswarrior.com`;
  return {
    campaignKey: 'patria200',
    clientIP: '127.0.0.1',
    loanAmount: o.loanAmount,
    refererURL: 'https://testloans.com',
    personalInformation: {
      firstName: 'Sam',
      lastName: 'Ave',
      birthday: '1989/03/12',
      address: {
        zipCode: '55316',
        city: 'Champlin',
        state: 'MN',
        street: '11217 VERA CRUZ AVE N',
        monthsAtAddress: '72',
      },
      email,
      homeOwnership: 'rent',
      driversLicense: 'A123456789',
      driversLicenseState: 'MN',
      cellPhone: '5555555555',
      homePhone: '',
      ssnNumber: o.ssnNumber,
      military: 'no',
    },
    employmentInformation: {
      incomeType: 'employed',
      employerName: "Children's Hospital",
      monthsEmployed: '60',
      zipCode: '55316',
      monthlyIncome: o.monthlyIncome,
      payFrequency: 'biweekly',
      nextPayDate: getNextPayDate(),
      secondPayDate: getSecondPayDate(),
      employerPhone: '5555555555',
      payType: 'direct_deposit',
    },
    bankInformation: {
      bankRoutingNumber: '071214579',
      bankAccountNumber: '123456789',
      bankName: 'US BANK NA',
      bankAccountType: 'checking',
      monthsAtBank: '30',
    },
    leadProvider: 'Round Sky',
    vendor: { autoImport: true },
  };
}
