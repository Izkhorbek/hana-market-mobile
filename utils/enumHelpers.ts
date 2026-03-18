/**
 * Resolves a lowercase form string value to its corresponding numeric enum value.
 *
 * Convention: form option values are lowercase_snake_case versions of enum keys.
 *   e.g. 'employee' → EWorkerType['EMPLOYEE'] → 1000
 *        'full_time' → EWorkType['FULL_TIME'] → 1000
 *
 * @param enumObj  - The enum object (e.g. EWorkerType)
 * @param value    - The lowercase form string (e.g. 'employee')
 * @returns        - The numeric enum value, or undefined if not found
 */
export function resolveEnum<T extends Record<string, number | string>>(
  enumObj: T,
  value: string
): number | undefined {
  const key = value.toUpperCase() as keyof T;
  const resolved = enumObj[key];
  return typeof resolved === 'number' ? resolved : undefined;
}
