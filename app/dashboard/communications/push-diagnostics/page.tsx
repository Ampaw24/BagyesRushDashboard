import type { Metadata } from "next";

import { PageHeader } from "../../_components/page-header";
import { NoPermissionState } from "../../_components/empty-state";
import { PushTester } from "./push-tester";
import { can, getPermissions } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Push Diagnostics — BagyesRUSH",
};

/**
 * "Push isn't working" — the screen that turns that into an answer.
 *
 * The endpoint behind it has existed all along with nothing calling it, which
 * is the worst place for a diagnostic to be: available exactly when nobody
 * knows it exists. It needs `communications.send` rather than a settings
 * permission because it really does send a message to a real handset.
 */
export default async function PushDiagnosticsPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "communications.send")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Push diagnostics" description="Send one push and read the answer." />
        <NoPermissionState what="push diagnostics" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Push diagnostics"
        description="Send one real push to one person and read exactly what Firebase said back."
      />

      <HowItWorks />

      <PushTester />
    </div>
  );
}

/**
 * The screen was built without this and was not self-explanatory, which for a
 * tool somebody reaches for once every few months is the same as not having it.
 */
function HowItWorks() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-muted/40 p-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold text-foreground">When to use this</h2>
        <p className="text-sm text-text-secondary">
          Somebody says they are not getting notifications. This sends them a real push right now
          and shows the raw answer from Firebase, so you can tell the difference between{" "}
          <em>we never sent it</em>, <em>we sent it and Firebase rejected it</em>, and{" "}
          <em>Firebase accepted it and the phone did nothing with it</em>. Those are three different
          problems and they are fixed by three different people.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold text-foreground">Why not just use Firebase?</h2>
        <p className="text-sm text-text-secondary">
          The Firebase console counts a message as delivered the moment it accepts it for sending.
          A phone that showed nothing looks identical there to one that showed the notification
          perfectly, so its numbers cannot answer the only question you have.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-foreground">How to read the result</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-text-secondary">
          <li>
            <span className="font-medium text-foreground">Search for the person</span> and check the
            chip. <span className="font-medium">&ldquo;no device&rdquo;</span> means they have never
            opened the app on a phone that registered for notifications — there is nothing to send
            to, and nothing else on this page will help until they sign in on their phone.
          </li>
          <li>
            <span className="font-medium text-foreground">Send with &ldquo;Both&rdquo; first.</span>{" "}
            That is what the app really sends. If it arrives, push works and the original complaint
            is about something else — a specific event not firing, or the phone&rsquo;s own
            notification settings.
          </li>
          <li>
            <span className="font-medium text-foreground">If it does not arrive, try the other two.</span>{" "}
            <span className="font-medium">Notification only</span> is drawn by the operating system
            and arrives even when the app is closed. <span className="font-medium">Data only</span>{" "}
            is handed to the app to deal with. If notification-only works and data-only does not,
            the credentials are fine and it is the mobile app&rsquo;s handler — that is a message for
            the app developer, not a server problem.
          </li>
          <li>
            <span className="font-medium text-foreground">HTTP 200</span> means Firebase accepted
            it. Anything else is a real rejection and the JSON underneath says why —{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-xs">UNREGISTERED</code> is a dead
            token from an app that was uninstalled or reinstalled, and that token is deleted
            automatically when it comes back.
          </li>
        </ol>
      </div>

      <p className="text-sm text-text-muted">
        This sends a genuine notification to a real person&rsquo;s phone. Use your own account, or
        tell them first.
      </p>
    </section>
  );
}
