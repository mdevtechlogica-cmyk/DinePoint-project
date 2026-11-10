/** Canonical plan entitlement keys (Super Admin → Plan → org Subscription). */
export const EntitlementKeys = {
  outlets: 'outlets',
  tables: 'tables',
  maxFloorsPerRestaurant: 'max_floors_per_restaurant',
  maxRoomsPerRestaurant: 'max_rooms_per_restaurant',
  reportHistoryDays: 'report_history_days',
  reports: 'reports',
  smsPerMonth: 'sms_per_month',
  whatsappPerMonth: 'whatsapp_per_month',
  adsEnabled: 'ads_enabled',
  employeesEnabled: 'employees_enabled',
  exportReports: 'export_reports',
} as const;

export type EntitlementKey =
  (typeof EntitlementKeys)[keyof typeof EntitlementKeys];

/** Applied when an org has no active subscription. */
export const DEFAULT_ENTITLEMENTS: Record<EntitlementKey, number | boolean> = {
  [EntitlementKeys.outlets]: 1,
  [EntitlementKeys.tables]: 10,
  [EntitlementKeys.maxFloorsPerRestaurant]: 2,
  [EntitlementKeys.maxRoomsPerRestaurant]: 4,
  [EntitlementKeys.reportHistoryDays]: 7,
  [EntitlementKeys.reports]: false,
  [EntitlementKeys.smsPerMonth]: 0,
  [EntitlementKeys.whatsappPerMonth]: 0,
  [EntitlementKeys.adsEnabled]: true,
  [EntitlementKeys.employeesEnabled]: false,
  [EntitlementKeys.exportReports]: false,
};

export type ResolvedEntitlements = {
  planId: string | null;
  planName: string | null;
  planSlug: string | null;
  subscriptionStatus: string | null;
  limits: {
    outlets: number;
    tables: number;
    maxFloorsPerRestaurant: number;
    maxRoomsPerRestaurant: number;
    reportHistoryDays: number;
    smsPerMonth: number;
    whatsappPerMonth: number;
  };
  flags: {
    reports: boolean;
    adsEnabled: boolean;
    employeesEnabled: boolean;
    exportReports: boolean;
  };
  raw: Record<string, unknown>;
};
