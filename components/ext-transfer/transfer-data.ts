// components/ext-transfer/transfer-data.ts: Shared mock data and types for the EXT transfer workspace.
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRightLeft,
  Box,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active?: boolean;
  badge?: string;
};


export type CanisterEntry = {
  id: string;
  name: string;
  status: string;
};

export const PINEAPPLE_PUNKS_CANISTER_ID = "skjpp-haaaa-aaaae-qac7q-cai";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, active: true, badge: "5" },
  { label: "Collection Flow", icon: Box },
  { label: "Split Transfers", icon: ArrowRightLeft },
  { label: "Wallet Safety", icon: ShieldCheck, badge: "3" },
  { label: "Automation", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

export const CANISTERS: CanisterEntry[] = [
  { id: "oeee4-qaaaa-aaaak-qaaeq-cai", name: "Motoko Ghosts", status: "Active" },
  { id: "pk6rk-6aaaa-aaaae-qaazq-cai", name: "BTC Flower", status: "Active" },
  { id: "dhiaa-ryaaa-aaaae-qabva-cai", name: "ETH Flower", status: "Active" },
  { id: "4ggk4-mqaaa-aaaae-qad6q-cai", name: "ICP Flower", status: "Active" },
  { id: "bzsui-sqaaa-aaaah-qce2a-cai", name: "Poked bots", status: "Active" },
  { id: "jv55j-riaaa-aaaal-abvnq-cai", name: "Poked Bots Mutant Army", status: "Active" },
  { id: "ugdkf-taaaa-aaaak-acoia-cai", name: "Motoko Mechs", status: "Active" },
  { id: "3vdxu-laaaa-aaaah-abqxa-cai", name: "Cubetopia Islands", status: "Active" },
  { id: PINEAPPLE_PUNKS_CANISTER_ID, name: "Pineapple Punks", status: "Active" },
  { id: "u2kyg-aaaaa-aaaag-qc5ja-cai", name: "Btc Flower Gen 2.0", status: "Active" },
  { id: "ah2fs-fqaaa-aaaak-aalya-cai", name: "Distrikt PODs", status: "Active" },
  { id: "mntgc-lqaaa-aaaag-qcmyq-cai", name: "ICPPUNK", status: "Active" },
  { id: "t2mog-myaaa-aaaal-aas7q-cai", name: "Pet Bots", status: "Active" },
];


export const FILTER_TABS = ["All", "Unsent", "Queued", "Recently Sent"];
