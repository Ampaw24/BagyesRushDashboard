"use client";

import { useEffect, useState } from "react";

import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { DetailDialog, DialogTabs } from "../_components/detail-dialog";
import { RecordExportButton } from "../_components/record-export-button";
import type { ExportableRecord } from "@/lib/export/record-export";
import { userStatusMeta } from "../_lib/status";
import { formatCurrency, formatDate, formatDateTimeOrDash } from "../_lib/format";
import { loadCustomerDetailAction } from "./_actions";
import { loadCustomerWalletAction } from "./_wallet-actions";
import { WalletTab } from "../_components/wallet-tab";
import type { CustomerDetail, CustomerRow } from "@/lib/mappers/customer.mapper";
import type { WalletSummary, WalletTransactionRow } from "@/lib/mappers/wallet.mapper";
import type { CustomerPayoutMethodDto } from "@/lib/types/api";

type WalletState = {
  summary: WalletSummary;
  payoutMethod: CustomerPayoutMethodDto | null;
  transactions: WalletTransactionRow[];
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Opens with the row data already in hand, then fills in the spend summary
 * from `GET /admin/customers/{id}` — the list endpoint does not include it.
 *
 * The wallet is a second tab rather than more fields, and is fetched only when
 * that tab is opened: it needs `customers.wallet`, which a support agent does
 * not hold, so fetching it on open would fire a 403 for the role that uses this
 * dialog most.
 */
export function ViewCustomerDialog({ customer, onClose }: { customer: CustomerRow; onClose: () => void }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"details" | "wallet">("details");
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [walletError, setWalletError] = useState("");

  useEffect(() => {
    let active = true;

    loadCustomerDetailAction(customer.id).then((result) => {
      if (!active) return;
      if (result.ok) setDetail(result.data);
      else setError(result.message);
    });

    return () => {
      active = false;
    };
  }, [customer.id]);

  useEffect(() => {
    if (tab !== "wallet" || wallet) return;

    let active = true;

    loadCustomerWalletAction(customer.id).then((result) => {
      if (!active) return;
      if (result.ok) setWallet(result.data);
      else setWalletError(result.message);
    });

    return () => {
      active = false;
    };
  }, [tab, wallet, customer.id]);

  /**
   * Built at click time, not at render: the spend summary and the wallet both
   * arrive after the dialog opens, so a record captured earlier would export
   * blanks for the figures somebody most likely wants.
   *
   * The wallet section appears only once that tab has been opened - it is a
   * separate request behind `customers.wallet`, and firing it for an export
   * would 403 for the support role this dialog mostly serves.
   */
  const buildExport = (): ExportableRecord => ({
    kind: "Customer",
    title: customer.fullName,
    subtitle: [customer.phone, customer.email].filter(Boolean).join(" · ") || undefined,
    sections: [
      {
        title: "Customer",
        fields: [
          { label: "Full name", value: customer.fullName },
          { label: "Phone", value: customer.phone ?? "—" },
          { label: "Email", value: customer.email ?? "—" },
          { label: "Phone verified", value: customer.phoneVerified ? "Yes" : "No" },
          { label: "Status", value: userStatusMeta[customer.status].label },
          { label: "Joined", value: formatDate(customer.joinedAt) },
          { label: "Referral code", value: customer.referralCode ?? "—" },
          { label: "Referrals", value: String(customer.referralCount) },
        ],
      },
      ...(detail
        ? [
            {
              title: "Order history",
              fields: [
                { label: "Orders placed", value: String(detail.summary.ordersPlaced) },
                { label: "Delivered", value: String(detail.summary.ordersDelivered) },
                { label: "Cancelled", value: String(detail.summary.ordersCancelled) },
                { label: "Lifetime value", value: formatCurrency(detail.summary.lifetimeValue) },
                {
                  label: "Last ordered",
                  value: formatDateTimeOrDash(detail.summary.lastOrderedAt),
                },
              ],
            },
          ]
        : []),
      ...(wallet
        ? [
            {
              title: "Wallet",
              fields: [
                { label: "Balance", value: formatCurrency(wallet.summary.balance) },
                {
                  label: "Payout network",
                  value: wallet.payoutMethod?.provider?.name ?? "Not chosen",
                },
                {
                  label: "Payout destination",
                  value: payoutDestination(wallet.payoutMethod, customer.phone, customer.phoneVerified),
                },
              ],
            },
          ]
        : []),
    ],
  });

  return (
    <DetailDialog
      label="View customer"
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <RecordExportButton
          build={buildExport}
          // Until the detail request lands the record would export the row and
          // nothing else, which is not what anybody means by "export".
          disabled={!detail && !error}
        />
      }
      header={
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* `profile_picture_url` has been on the customer resource all
                along and was rendered nowhere — the dialog drew initials even
                when there was a photo to show. */}
            <Avatar
              name={customer.fullName}
              src={customer.avatarUrl}
              className="h-16 w-16 text-lg"
              zoomable
              caption={customer.fullName}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <h2 className="break-words text-base font-semibold text-foreground">
                {customer.fullName}
              </h2>
              <span className="break-words text-xs text-text-muted">
                {customer.phone ?? customer.email ?? "No contact details"}
              </span>
            </span>
          </div>
          <Badge meta={userStatusMeta[customer.status]} />
        </div>
      }
    >
        <DialogTabs
          tabs={[
            { key: "details", label: "Details" },
            { key: "wallet", label: "Wallet" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "wallet" ? (
          walletError ? (
            <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
              {walletError}
            </p>
          ) : !wallet ? (
            <p className="py-6 text-center text-sm text-text-muted">Loading wallet…</p>
          ) : (
            <>
              <WalletTab
                party="customer"
                ownerId={customer.id}
                ownerName={customer.fullName}
                summary={wallet.summary}
                transactions={wallet.transactions}
                canAdjust
              />
              {wallet.payoutMethod && (
                <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-surface-muted p-4 text-sm sm:grid-cols-2">
                  <Field
                    label="Payout network"
                    value={wallet.payoutMethod.provider?.name ?? "Not chosen"}
                  />
                  <Field
                    label="Payout destination"
                    value={payoutDestination(
                      wallet.payoutMethod,
                      customer.phone,
                      customer.phoneVerified,
                    )}
                  />
                  <div className="sm:col-span-2">
                    <dt className="text-text-muted">Where payouts go</dt>
                    <dd className="break-words text-text-secondary">
                      {wallet.payoutMethod.matches_account_phone
                        ? "The verified phone number on this account. A customer cannot send a payout anywhere else."
                        : customer.phoneVerified
                          ? "Their verified number, once they choose a network. A customer never types a payout number — the server takes it from the line they signed in with, so a wallet cannot become a cash-out route for somebody else's card."
                          : "Nowhere yet. The destination is the account's own verified number, and this phone is not verified."}
                    </dd>
                  </div>
                </dl>
              )}
            </>
          )
        ) : (
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Email" value={customer.email ?? "—"} />
          <Field label="Phone" value={customer.phone ?? "—"} />
          <Field label="Phone verified" value={customer.phoneVerified ? "Yes" : "No"} />
          <Field label="Joined" value={formatDate(customer.joinedAt)} />
          <Field label="Referral code" value={customer.referralCode ?? "—"} />
          <Field label="Referrals" value={customer.referralCount} />

          {detail ? (
            <>
              <Field label="Orders placed" value={detail.summary.ordersPlaced} />
              <Field label="Delivered" value={detail.summary.ordersDelivered} />
              <Field label="Cancelled" value={detail.summary.ordersCancelled} />
              <Field label="Lifetime value" value={formatCurrency(detail.summary.lifetimeValue)} />
              <Field label="Last ordered" value={formatDateTimeOrDash(detail.summary.lastOrderedAt)} />
            </>
          ) : (
            !error && <Field label="Order history" value={<span className="text-text-muted">Loading…</span>} />
          )}
        </dl>
        )}

        {error && (
          <p className="break-words rounded-lg bg-status-critical/10 px-3.5 py-2.5 text-sm text-status-critical">
            {error}
          </p>
        )}
    </DetailDialog>
  );
}

/**
 * Where a cash-out would actually land.
 *
 * "Payout number: —" read as "we do not know where to pay them", which is not
 * what an empty field means here. A customer never types a payout number: they
 * choose a mobile-money network and the server stamps the number from the
 * verified line they sign in with. So the destination is already decided the
 * moment the phone is verified, and the only thing that can be missing is the
 * network.
 */
function payoutDestination(
  payout: CustomerPayoutMethodDto | null,
  phone: string | null,
  phoneVerified: boolean,
): string {
  if (payout?.account_number_last4) {
    return `•••• ${payout.account_number_last4}`;
  }

  if (!phoneVerified) {
    return "Phone not verified — cannot be paid";
  }

  return phone ? `${phone} — once a network is chosen` : "Their verified number";
}
