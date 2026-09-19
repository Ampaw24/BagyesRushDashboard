"use client";

import { useEffect, useState } from "react";

import { Avatar } from "../_components/avatar";
import { Badge } from "../_components/status-badge";
import { DetailDialog, DialogTabs } from "../_components/detail-dialog";
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

  return (
    <DetailDialog
      label="View customer"
      onClose={onClose}
      className="max-w-2xl"
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
                    label="Payout number"
                    value={
                      wallet.payoutMethod.account_number_last4
                        ? `•••• ${wallet.payoutMethod.account_number_last4}`
                        : "—"
                    }
                  />
                  <div className="sm:col-span-2">
                    <dt className="text-text-muted">Where payouts go</dt>
                    <dd className="break-words text-text-secondary">
                      {wallet.payoutMethod.matches_account_phone
                        ? "The verified phone number on this account. A customer cannot send a payout anywhere else."
                        : "No verified payout number on file. Cash-out is refused until the customer picks a network for their own verified number."}
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
