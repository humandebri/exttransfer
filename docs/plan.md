## EXTってどんな規格？

EXTのコアは最低限これを持つ、という思想です（＝まず canister に“何ができるか”を問い合わせてから使う）:

* `extensions : query () -> async [Extension]`（このcanisterが実装してる拡張一覧を返す）
* `balance : query (BalanceRequest) -> async BalanceResponse`
* `transfer : shared (TransferRequest) -> async TransferResponse`

この3つが「標準コア」として説明されています。 ([GitHub][1])

NFT用途でよく出てくる拡張が `@ext/nonfungible` で、サンプルでは追加で

* `mintNFT`
* `bearer(token)`（そのNFTの所有者）
  みたいな関数を提供する、と書かれてます。 ([GitHub][1])

さらにEXTの “TokenIdentifier” は **canister id + token index** を材料にしたグローバル一意ID（hex）で、`\\x0Atid` をドメインセパレータに使う構造だと説明されています。 ([GitHub][1])

---

## 「Next.js 16.0.10

---

## 一括送信アプリの設計（EXTの現実に合わせた方針）

あなたが欲しいUI要件は理解してる：

* NFTマーケットっぽくアイコンがグリッドで並ぶ
* 各NFTにチェックボックス
* 全選択
* 送信先をモーダルで指定して一括 transfer
* コレクションの canisterId を追加したら任意コレクション対応
* shadcn + グレー基調
* 「24 5.4% 63.9%」の雰囲気

ここでEXTの厄介ポイント：

1. **“所有NFT一覧をどう取るか” がEXTで統一されてない**
   多くの実装は `tokens_ext(accountId)` みたいなのを生やすけど、戻り型も揺れるし、そもそも無いコレクションもある。

2. **画像URLも統一されてない**
   Entrepot系は `https://<canister>.raw.ic0.app/?tokenid=<tokenId>` みたいなリダイレクトを置いてることが多い（サンプル実装でも tokenid パラメータで同じリダイレクトにしたい旨が出てくる）。 ([GitHub][3])
   でも全コレクションがそうとは限らない。

だからこれに対応していないNFTは一旦対応しない

## 実装（Next.js + shadcn / グレーUI）作っておいた

キャンバスに **そのまま貼って動かせる“1ページ完結版”** を置きました（`app/page.tsx` 想定）。

* グリッド + チェック + 全選択/全解除
* 送信モーダル（Principal / AccountId 切替）
* canisterIdの追加・削除（localStorage永続化）
* 読込（tokens_extで所有tokenIdを取って、画像URLを推測）
* 一括送信（選択分を順次 `transfer`）
* デザインは指定の数字を雑に吸収して：

  * **24px** → `p-6` / `gap-6`
  * **5.4%** → `bg-zinc-950/5`（約5%透過）
  * **63.9%** → `text-zinc-900/65`（約65%濃度）

### セットアップ手順（要点）

1. Next.jsプロジェクト作成（Node 20.9+ 必須） ([Next.js][2])
2. shadcn導入（Next.js手順は公式がこれ） ([shadcn][4])
3. 依存追加：

   * `@dfinity/agent @dfinity/auth-client @dfinity/candid @dfinity/principal`
   * `@noble/hashes crc-32`（AccountIdentifier生成用。AccountIdentifierはprincipal+subaccountから導出される） ([internetcomputer.org][5])
4. shadcnコンポーネント追加：

   * `button card checkbox dialog input label scroll-area tabs`

---

## 使いどころ・壊れどころ（正直ポイント）

* **動くコレクション**：`extensions / tokens_ext / transfer` がこの実装の想定型で出てくるEXT canister
* **動かない典型**：

  * `tokens_ext` が無い / 型が違う（TokenIndex返す等）
  * 画像のHTTPルーティングが違う（`?tokenid=`じゃない）
* そういうコレクションは、結局「そのcanisterのCandidに合わせてIDLと取得部分を差し替え」になります（EXTの“拡張可能”がここで牙をむく）。

---

キャンバスのコードは「最低限のEXT一括送信UI」を最速で形にしたもの。
次に精度を上げるなら、**(A) tokens_extの型ゆれ吸収**（TokenIndex→TokenIdentifier変換含む）と、**(B) 画像URL解決の戦略化**（コレクションごとにテンプレ登録 or メタデータ取得）を入れるのが“現実的に強い”ルートです。

import {
  ArrowRightLeftIcon,
  CalendarClockIcon,
  ChartNoAxesCombinedIcon,
  ChartPieIcon,
  ChartSplineIcon,
  ClipboardListIcon,
  Clock9Icon,
  CrownIcon,
  FacebookIcon,
  HashIcon,
  InstagramIcon,
  LanguagesIcon,
  LinkedinIcon,
  SettingsIcon,
  SquareActivityIcon,
  TwitterIcon,
  Undo2Icon,
  UsersIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'

import LanguageDropdown from '@/components/shadcn-studio/blocks/dropdown-language'
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

const ApplicationShell = () => {
  return (
    <div className='flex min-h-dvh w-full'>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <ChartNoAxesCombinedIcon />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className='bg-primary/10 rounded-full'>5</SidebarMenuBadge>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Pages</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <ChartSplineIcon />
                        <span>Content Performance</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <UsersIcon />
                        <span>Audience Insight</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <ChartPieIcon />
                        <span>Engagement Metrics</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <HashIcon />
                        <span>Hashtag Performance</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className='bg-primary/10 rounded-full'>3</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <ArrowRightLeftIcon />
                        <span>Competitor Analysis</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <Clock9Icon />
                        <span>Campaign Tracking</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <ClipboardListIcon />
                        <span>Sentiment Tracking</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <CrownIcon />
                        <span>Influencer</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Supporting Features</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <SquareActivityIcon />
                        <span>Real Time Monitoring</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <CalendarClockIcon />
                        <span>Schedule Post & Calendar</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <Undo2Icon />
                        <span>Report & Export</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <SettingsIcon />
                        <span>Settings & Integrations</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href='#'>
                        <UsersIcon />
                        <span>User Management</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className='flex flex-1 flex-col'>
          <header className='bg-card sticky top-0 z-50 border-b'>
            <div className='mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6'>
              <div className='flex items-center gap-4'>
                <SidebarTrigger className='[&_svg]:!size-5' />
                <Separator orientation='vertical' className='hidden !h-4 sm:block' />
                <Breadcrumb className='hidden sm:block'>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='#'>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href='#'>Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Free</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className='flex items-center gap-1.5'>
                <LanguageDropdown
                  trigger={
                    <Button variant='ghost' size='icon'>
                      <LanguagesIcon />
                    </Button>
                  }
                />
                <ProfileDropdown
                  trigger={
                    <Button variant='ghost' size='icon' className='size-9.5'>
                      <Avatar className='size-9.5 rounded-md'>
                        <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png' />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
              </div>
            </div>
          </header>
          <main className='mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6'>
            <Card className='h-250'>
              <CardContent className='h-full'>
                <div className='h-full rounded-md border bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_1px,var(--card)_2px,var(--card)_15px)]' />
              </CardContent>
            </Card>
          </main>
          <footer>
            <div className='text-muted-foreground mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6'>
              <p className='text-sm text-balance max-sm:text-center'>
                {`©${new Date().getFullYear()}`}{' '}
                <a href='#' className='text-primary'>
                  shadcn/studio
                </a>
                , Made for better web design
              </p>
              <div className='flex items-center gap-5'>
                <a href='#'>
                  <FacebookIcon className='size-4' />
                </a>
                <a href='#'>
                  <InstagramIcon className='size-4' />
                </a>
                <a href='#'>
                  <LinkedinIcon className='size-4' />
                </a>
                <a href='#'>
                  <TwitterIcon className='size-4' />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default ApplicationShell

こんなデザイン参考にしてほしい
