import { ExportMenu } from "./export-menu";
import { getExportOptions } from "@/lib/services/platform-settings.service";

/**
 * The export button, ready to drop into a page header.
 *
 * A server component wrapper so a list page adds exporting in one line without
 * having to fetch the options itself or know whether email is configured. It
 * renders nothing when this admin cannot export this module — the backend would
 * refuse anyway, and a button that 403s on click is worse than no button.
 */
export async function ExportAction({
  resource,
  filters = {},
  label,
}: {
  resource: string;
  filters?: Record<string, string | number | boolean | undefined>;
  label?: string;
}) {
  const options = await getExportOptions();

  if (!options?.resources.some((entry) => entry.key === resource)) {
    return null;
  }

  return (
    <ExportMenu
      resource={resource}
      filters={filters}
      emailEnabled={options.email_enabled}
      label={label}
    />
  );
}
