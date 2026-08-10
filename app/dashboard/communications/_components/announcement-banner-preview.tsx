import { CloseIcon } from "../../_lib/icons";

type AnnouncementBannerPreviewProps = {
  title: string;
  description: string;
  imageUrl?: string | null;
  ctaLabel?: string;
  dismissible?: boolean;
};

export function AnnouncementBannerPreview({ title, description, imageUrl, ctaLabel, dismissible = true }: AnnouncementBannerPreviewProps) {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- previews user-uploaded data URLs, which next/image can't optimize
        <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
      )}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="break-words text-sm font-semibold text-foreground">{title || "Announcement title"}</h4>
          {dismissible && <CloseIcon className="h-4 w-4 shrink-0 text-text-muted" />}
        </div>
        <p className="break-words text-xs text-text-secondary">{description || "Short description of your announcement."}</p>
        {ctaLabel && (
          <span className="mt-1 inline-flex h-8 w-fit items-center rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground">
            {ctaLabel}
          </span>
        )}
      </div>
    </div>
  );
}
