/** This temporary branch shows the holding page unless explicitly disabled. */
export function isMaintenanceMode() {
  return process.env.SITE_MAINTENANCE_MODE !== "off";
}
