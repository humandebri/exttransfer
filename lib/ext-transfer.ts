// lib/ext-transfer.ts: EXT transferのエージェント呼び出しをまとめる。署名経路の共通化が目的。
import { Actor } from "@dfinity/agent";
import type { Agent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import type { Principal } from "@dfinity/principal";

export type TransferTo =
  | { principal: Principal }
  | { address: string };

export type TransferFrom =
  | { principal: Principal }
  | { address: string };

export type TransferError =
  | { CannotNotify: string }
  | { InsufficientBalance: null }
  | { InvalidToken: string }
  | { Rejected: null }
  | { Unauthorized: string }
  | { Other: string };

export type TransferResponse =
  | { ok: bigint }
  | { err: TransferError };

export type TransferRequest = {
  to: TransferTo;
  token: string;
  notify: boolean;
  from: TransferFrom;
  memo: number[];
  subaccount: number[][];
  amount: bigint;
};

export type TransferActor = {
  transfer: (request: TransferRequest) => Promise<TransferResponse>;
};

export const transferIdlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const toVariant = IDL.Variant({
    principal: IDL.Principal,
    address: IDL.Text,
  });
  const fromVariant = IDL.Variant({
    principal: IDL.Principal,
    address: IDL.Text,
  });
  const errorVariant = IDL.Variant({
    CannotNotify: IDL.Text,
    InsufficientBalance: IDL.Null,
    InvalidToken: IDL.Text,
    Rejected: IDL.Null,
    Unauthorized: IDL.Text,
    Other: IDL.Text,
  });
  const request = IDL.Record({
    to: toVariant,
    token: IDL.Text,
    notify: IDL.Bool,
    from: fromVariant,
    memo: IDL.Vec(IDL.Nat8),
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    amount: IDL.Nat,
  });
  const response = IDL.Variant({ ok: IDL.Nat, err: errorVariant });
  return IDL.Service({
    transfer: IDL.Func([request], [response], []),
  });
};

export async function transferExtToken(
  agent: Agent,
  canisterId: string,
  request: TransferRequest
): Promise<TransferResponse> {
  const actor = Actor.createActor<TransferActor>(transferIdlFactory, {
    agent,
    canisterId,
  });
  return actor.transfer(request);
}

export function formatTransferError(error: TransferError): string {
  if ("CannotNotify" in error) {
    return error.CannotNotify;
  }
  if ("InsufficientBalance" in error) {
    return "Insufficient balance";
  }
  if ("InvalidToken" in error) {
    return error.InvalidToken;
  }
  if ("Rejected" in error) {
    return "Rejected";
  }
  if ("Unauthorized" in error) {
    return error.Unauthorized;
  }
  if ("Other" in error) {
    return error.Other;
  }
  return "Unknown error";
}
