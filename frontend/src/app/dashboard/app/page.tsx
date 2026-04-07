import type { ReactNode } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Download,
  ExternalLink,
  LinkIcon,
  QrCode,
  ScanLine,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const androidUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim() ?? "";
const iosUrl = process.env.NEXT_PUBLIC_IOS_APP_URL?.trim() ?? "";

async function buildQrCode(url: string) {
  if (!url) {
    return null;
  }

  try {
    return await QRCode.toDataURL(url, {
      width: 256,
      margin: 4,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch {
    return null;
  }
}

type AppDownload = {
  title: string;
  subtitle: string;
  description: string;
  url: string;
  qrCode: string | null;
  accentClassName: string;
  buttonClassName: string;
  iconShellClassName: string;
};

export default async function AppPage() {
  const [androidQrCode, iosQrCode] = await Promise.all([
    buildQrCode(androidUrl),
    buildQrCode(iosUrl),
  ]);

  const downloads: AppDownload[] = [
    {
      title: "Android",
      subtitle: "APK para instalacao direta",
      description:
        "Escaneie com a camera do celular para abrir o download do app no Android.",
      url: androidUrl,
      qrCode: androidQrCode,
      accentClassName:
        "border-[#d6f5d9] bg-[linear-gradient(180deg,#f4fff5_0%,#ffffff_100%)] dark:border-[#294636] dark:bg-[linear-gradient(180deg,#18241d_0%,#11161a_100%)]",
      buttonClassName:
        "bg-[#16a34a] text-white hover:bg-[#15803d] focus-visible:ring-[#16a34a]/30",
      iconShellClassName:
        "bg-[#ebfff0] text-[#15803d] ring-[#d6f5d9] dark:bg-[#1d3125] dark:text-[#4ade80] dark:ring-[#294636]",
    },
    {
      title: "iOS",
      subtitle: "Link de instalacao para iPhone",
      description:
        "Escaneie com a camera do iPhone para abrir a pagina de instalacao do app.",
      url: iosUrl,
      qrCode: iosQrCode,
      accentClassName:
        "border-[#d9e8ff] bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_100%)] dark:border-[#273d63] dark:bg-[linear-gradient(180deg,#141d2c_0%,#11161a_100%)]",
      buttonClassName:
        "bg-[#2563eb] text-white hover:bg-[#1d4ed8] focus-visible:ring-[#2563eb]/30",
      iconShellClassName:
        "bg-[#edf4ff] text-[#2563eb] ring-[#d9e8ff] dark:bg-[#18253c] dark:text-[#60a5fa] dark:ring-[#273d63]",
    },
  ];

  const configuredCount = downloads.filter(
    (download) => Boolean(download.url && download.qrCode),
  ).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#ffd9c2] bg-[linear-gradient(135deg,#fff8f3_0%,#ffffff_60%,#fff2e8_100%)] p-6 shadow-[0_24px_60px_rgba(255,92,0,0.08)] dark:border-[#4b2b18] dark:bg-[linear-gradient(135deg,#211714_0%,#16181d_58%,#1d1815_100%)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-80 bg-[radial-gradient(circle_at_top_right,rgba(255,92,0,0.18),transparent_62%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,92,0,0.22),transparent_62%)] lg:block" />
        <div className="relative space-y-4">
          <div className="flex size-14 items-center justify-center rounded-[24px] bg-[#ff5c00] text-white shadow-[0_20px_45px_rgba(255,92,0,0.25)]">
            <Smartphone className="size-7" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ff5c00]">
              Aplicativo
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Compartilhe o app com QR code para Android e iOS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Esta area centraliza os links oficiais do app para instalacao via
              celular. Basta escanear o QR code da plataforma desejada e seguir
              o download.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Highlight
              icon={<QrCode className="size-4" />}
              label="QR codes prontos"
              value={`${configuredCount}/2`}
            />
            <Highlight
              icon={<ScanLine className="size-4" />}
              label="Acesso rapido"
              value="Camera do celular"
            />
            <Highlight
              icon={<Download className="size-4" />}
              label="Download"
              value="Android e iOS"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6 lg:grid-cols-2">
          {downloads.map((download) => (
            <DownloadCard key={download.title} download={download} />
          ))}
        </div>

        <aside className="space-y-4">
          <Card className="rounded-[30px] border-white/75 bg-white/82 shadow-[0_20px_55px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f2127]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <InfoRow text="1. Abra a camera do celular ou um leitor de QR code." />
              <InfoRow text="2. Escaneie o card da plataforma desejada." />
              <InfoRow text="3. Toque no link aberto para iniciar a instalacao." />
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border-[#ffe1ce] bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_100%)] shadow-[0_20px_55px_rgba(255,92,0,0.08)] dark:border-[#5b341c] dark:bg-[linear-gradient(180deg,#2c211b_0%,#1f1916_100%)]">
            <CardContent className="space-y-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#ff5c00] dark:bg-[#3a2618]">
                <LinkIcon className="size-5" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Links configuraveis
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Os QR codes desta tela usam as URLs publicas do frontend. Se
                  algum card ainda nao estiver pronto, basta configurar o link
                  correspondente e atualizar a aplicacao.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DownloadCard({ download }: { download: AppDownload }) {
  const isReady = Boolean(download.url && download.qrCode);

  return (
    <Card
      className={`rounded-[30px] border shadow-[0_20px_55px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.24)] ${download.accentClassName}`}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {download.subtitle}
            </p>
            <CardTitle className="mt-2 text-2xl">{download.title}</CardTitle>
          </div>
          <div
            className={`flex size-12 items-center justify-center rounded-2xl shadow-sm ring-1 ${download.iconShellClassName}`}
          >
            <QrCode className="size-6" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {download.description}
        </p>

        <div className="flex justify-center rounded-[28px] border border-black/6 bg-white/92 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-[#f8fafc]">
          {isReady ? (
            <div className="rounded-[24px] bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
              <Image
                src={download.qrCode ?? ""}
                alt={`QR code para download no ${download.title}`}
                width={256}
                height={256}
                unoptimized
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          ) : (
            <div className="flex size-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d7d7d2] bg-[#fafaf7] px-5 text-center dark:border-[#cbd5e1] dark:bg-[#f8fafc]">
              <QrCode className="size-10 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium text-foreground">
                Link ainda nao configurado
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Defina a URL oficial desta plataforma para liberar o QR code.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-black/6 bg-white/85 p-4 dark:border-white/10 dark:bg-[#1a1d23]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8b85] dark:text-[#9ca3af]">
            Link atual
          </p>
          <p className="mt-2 break-all text-sm font-medium text-foreground">
            {download.url || "Aguardando configuracao do link"}
          </p>
        </div>

        {isReady ? (
          <a
            href={download.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 ${download.buttonClassName}`}
          >
            Baixar agora
            <ExternalLink className="size-4" />
          </a>
        ) : (
          <div className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#ecebe5] px-5 text-sm font-semibold text-[#8b8b85] dark:bg-[#2a2f37] dark:text-[#9ca3af]">
            Link pendente
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Highlight({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b8b85] dark:text-[#9ca3af]">
        <span className="text-[#ff5c00]">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InfoRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#f0efe9] bg-[#fafaf7] px-4 py-3 dark:border-white/10 dark:bg-[#17191f]">
      {text}
    </div>
  );
}
