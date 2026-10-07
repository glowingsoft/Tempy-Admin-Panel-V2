// ----------------------------------------------------------------------

export const MOCK_AUTH_PASSWORD = '123456';

/** Fixed admin email for login + password reset (not editable in UI) */
export const ADMIN_LOGIN_EMAIL = 'admin@tempy.com';

export const AUTH_ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    category: 'admin',
    mockEmail: ADMIN_LOGIN_EMAIL,
    apiUserType: 'admin',
    permission: 1,
    hasDashboard: true,
    signupEnabled: false,
  },
  {
    value: 'hospital_nhs',
    label: 'Hospitals/NHS',
    category: 'customer',
    mockEmail: 'hospitals@gmail.com',
    apiUserType: 'hospital',
    permission: 4,
    hasDashboard: true,
    signupEnabled: true,
  },
  {
    value: 'local_authority',
    label: 'Local Authority',
    category: 'customer',
    mockEmail: 'local@gmail.com',
    apiUserType: 'localAuthority',
    permission: 5,
    hasDashboard: true,
    signupEnabled: true,
  },
  {
    value: 'care_home',
    label: 'Care Home',
    category: 'customer',
    mockEmail: 'carehomes@gmail.com',
    apiUserType: 'careHome',
    permission: 2,
    hasDashboard: true,
    signupEnabled: true,
  },
  {
    value: 'individual_home_care',
    label: 'Individual (Home Care)',
    category: 'customer',
    mockEmail: 'individual@gmail.com',
    apiUserType: 'user',
    permission: 6,
    hasDashboard: true,
    signupEnabled: true,
  },
  {
    value: 'agency',
    label: 'Agency/Supplier',
    category: 'supplier',
    mockEmail: 'agency@gmail.com',
    apiUserType: 'agency',
    permission: 3,
    hasDashboard: true,
    signupEnabled: true,
  },
  {
    value: 'home_care_company',
    label: 'Home Care Company',
    category: 'supplier',
    mockEmail: 'homecarecompany@gmail.com',
    apiUserType: 'homeCareCompany',
    permission: 7,
    hasDashboard: true,
    signupEnabled: true,
  },
  {
    value: 'staff_member',
    label: 'Individual (Staff Member)',
    category: 'supplier',
    mockEmail: 'nurse@gmail.com',
    apiUserType: 'nurse',
    permission: 8,
    hasDashboard: true,
    signupEnabled: true,
  },
];

export const AUTH_ROLE_VALUES = AUTH_ROLE_OPTIONS.map((option) => option.value);

export const AUTH_PUBLIC_LOGIN_ROLE_OPTIONS = AUTH_ROLE_OPTIONS.filter(
  (option) => option.value !== 'admin'
);

export const AUTH_PUBLIC_LOGIN_ROLE_VALUES = AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.map(
  (option) => option.value
);

export const AUTH_SIGNUP_ROLE_OPTIONS = AUTH_ROLE_OPTIONS.filter((option) => option.value !== 'admin');

export const AUTH_SIGNUP_ROLE_VALUES = AUTH_SIGNUP_ROLE_OPTIONS.map((option) => option.value);

export const AUTH_ROLE_CUSTOMERS = AUTH_ROLE_OPTIONS.filter((option) => option.category === 'customer');

export const AUTH_ROLE_SUPPLIERS = AUTH_ROLE_OPTIONS.filter((option) => option.category === 'supplier');

export const AUTH_CUSTOMER_ROLE_VALUES = AUTH_ROLE_CUSTOMERS.map((option) => option.value);

export const AUTH_ORGANIZATION_CUSTOMER_ROLE_VALUES = AUTH_CUSTOMER_ROLE_VALUES.filter(
  (role) => role !== 'individual_home_care'
);

export const AUTH_SUPPLIER_ROLE_VALUES = AUTH_ROLE_SUPPLIERS.map((option) => option.value);

export const AUTH_ROLE_ADMINS = AUTH_ROLE_OPTIONS.filter((option) => option.category === 'admin');

export function getAuthRoleOption(role) {
  return AUTH_ROLE_OPTIONS.find((option) => option.value === role);
}

export function isCustomerSignupRole(role) {
  return AUTH_CUSTOMER_ROLE_VALUES.includes(role);
}

export function isOrganizationCustomerSignupRole(role) {
  return AUTH_ORGANIZATION_CUSTOMER_ROLE_VALUES.includes(role);
}

export function isIndividualHomeCareSignupRole(role) {
  return role === 'individual_home_care';
}

export function isStaffMemberSignupRole(role) {
  return role === 'staff_member';
}

export function isSupplierSignupRole(role) {
  return AUTH_SUPPLIER_ROLE_VALUES.includes(role);
}

/** Agency / home-care company (not individual nurse). */
export function isOrganizationSupplierSignupRole(role) {
  return isSupplierSignupRole(role) && !isStaffMemberSignupRole(role);
}

export function buildMockAuthUsers() {
  return AUTH_ROLE_OPTIONS.reduce((users, option) => {
    users[option.mockEmail] = {
      password: MOCK_AUTH_PASSWORD,
      role: option.value,
      permission: option.permission,
      name: `${option.label} User`,
      apiUserType: option.apiUserType,
      hasDashboard: option.hasDashboard,
    };
    return users;
  }, {});
}
