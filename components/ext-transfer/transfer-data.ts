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

export type NftItem = {
  id: string;
  name: string;
  collection: string;
  tokenId: string;
  tone: string;
  rarity: string;
};

export type CanisterEntry = {
  id: string;
  name: string;
  status: string;
};

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
  { id: "skjpp-haaaa-aaaae-qac7q-cai", name: "Pineapple Punks", status: "Active" },
  { id: "u2kyg-aaaaa-aaaag-qc5ja-cai", name: "Btc Flower Gen 2.0", status: "Active" },
  { id: "ah2fs-fqaaa-aaaak-aalya-cai", name: "Distrikt PODs", status: "Active" },
];

export const NFT_ITEMS: NftItem[] = [
  {
    id: "nft-01",
    name: "Rift Runner",
    collection: "Neon Tigers",
    tokenId: "#1147",
    tone: "from-amber-200/80 via-orange-100 to-rose-100",
    rarity: "Ultra",
  },
  {
    id: "nft-02",
    name: "Mint Drift",
    collection: "Neon Tigers",
    tokenId: "#1391",
    tone: "from-emerald-200/70 via-lime-100 to-stone-100",
    rarity: "Rare",
  },
  {
    id: "nft-03",
    name: "Signal Bloom",
    collection: "Paper Moons",
    tokenId: "#0204",
    tone: "from-sky-200/70 via-cyan-100 to-slate-100",
    rarity: "Legend",
  },
  {
    id: "nft-04",
    name: "Quartz Tide",
    collection: "Mirror Shell",
    tokenId: "#0440",
    tone: "from-stone-200/80 via-zinc-100 to-amber-100",
    rarity: "Core",
  },
  {
    id: "nft-05",
    name: "Echo Drop",
    collection: "Mirror Shell",
    tokenId: "#0811",
    tone: "from-rose-200/70 via-orange-100 to-neutral-100",
    rarity: "Rare",
  },
  {
    id: "nft-06",
    name: "Soft Node",
    collection: "Paper Moons",
    tokenId: "#1022",
    tone: "from-slate-200/70 via-zinc-100 to-stone-100",
    rarity: "Core",
  },
];

export const FILTER_TABS = ["All", "Unsent", "Queued", "Recently Sent"];
