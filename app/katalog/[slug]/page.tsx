import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Building2, CalendarClock, Database, ExternalLink, FileDown, Tag } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { SaveButton } from "@/components/SaveButton";
import { getDatasetDetail } from "@/lib/sources";
import { formatDateTime, formatNumber, truncate } from "@/lib/format";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatBytes(bytes?: number): string | null {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getDatasetDetail(slug);
  if (!detail) {
    return { title: "Dataset tidak ditemukan" };
  }
  return {
    title: detail.title,
    description: truncate(detail.notes || `${detail.title} — dataset Satu Data Indonesia.`, 155),
    alternates: { canonical: `${SITE_URL}/katalog/${detail.name}` },
    openGraph: {
      title: detail.title,
      description: truncate(detail.notes, 155),
      url: `${SITE_URL}/katalog/${detail.name}`,
    },
  };
}

export default async function DatasetDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getDatasetDetail(slug);

  if (!detail) {
    return (
      <div className="space-y-6">
        <Link
          href="/katalog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeft size={13} /> Kembali ke katalog
        </Link>
        <Card className="p-6">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Dataset tidak dapat dimuat</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Portal data.go.id tidak mengirim detail untuk <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{slug}</code>.
            Bisa jadi nama dataset salah, dataset sudah dihapus, atau portal sedang membalas halaman kosong.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/katalog"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Cari dataset lain
            </Link>
            <a
              href={`https://data.go.id/dataset/dataset/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Coba di data.go.id <ExternalLink size={12} />
            </a>
          </div>
        </Card>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: detail.title,
    description: truncate(detail.notes, 500),
    url: detail.url,
    identifier: detail.name,
    keywords: detail.tags.join(", "),
    dateModified: detail.lastModified,
    datePublished: detail.created,
    isAccessibleForFree: true,
    publisher: detail.organization ? { "@type": "Organization", name: detail.organization } : undefined,
    distribution: detail.resources.map((resource) => ({
      "@type": "DataDownload",
      name: resource.name,
      contentUrl: resource.url,
      encodingFormat: resource.format,
    })),
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        // JSON-LD dibangun dari data portal; escape `<` agar tidak bisa menutup tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link
          href="/katalog"
          className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeft size={13} /> Katalog
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <span className="text-zinc-500 dark:text-zinc-400">Dataset</span>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-3xl text-xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {detail.title}
          </h1>
          <SaveButton
            item={{
              name: detail.name,
              title: detail.title,
              organization: detail.organization,
              url: detail.url,
              tags: detail.tags,
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {detail.organization ? (
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={13} /> {detail.organization}
            </span>
          ) : null}
          {detail.kategori ? <Badge tone="blue">{detail.kategori}</Badge> : null}
          {detail.prioritasTahun ? <Badge tone="neutral">tahun {detail.prioritasTahun}</Badge> : null}
          {detail.lastModified ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} /> diperbarui {formatDateTime(detail.lastModified)}
            </span>
          ) : null}
        </div>
      </header>

      {detail.notes ? (
        <Card className="p-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{detail.notes}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title={`${detail.resources.length} berkas unduhan`}
          subtitle="Tautan langsung dari penerbit dataset (bukan salinan)."
          right={
            <a
              href={detail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Halaman asli <ExternalLink size={12} />
            </a>
          }
        />
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {detail.resources.map((resource) => (
            <li key={resource.url} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <FileDown size={14} className="shrink-0" />
                  <span className="truncate">{resource.name}</span>
                </a>
                {resource.description ? (
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{truncate(resource.description, 140)}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <Badge tone={resource.ok === false ? "red" : "green"}>{resource.format}</Badge>
                {formatBytes(resource.size) ? <span>{formatBytes(resource.size)}</span> : null}
                {resource.lastModified ? <span>{formatDateTime(resource.lastModified)}</span> : null}
              </div>
            </li>
          ))}
          {detail.resources.length === 0 ? (
            <li className="px-5 py-8 text-center text-xs text-zinc-500">
              Portal tidak melaporkan berkas unduhan untuk dataset ini — buka halaman aslinya.
            </li>
          ) : null}
        </ul>
      </Card>

      {detail.tags.length > 0 ? (
        <Card className="p-5">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <Tag size={12} /> topik dataset
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <Link
                key={tag}
                href={`/katalog?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              >
                {tag}
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      <p className="flex items-start gap-2 rounded-2xl border border-zinc-200/70 bg-white/60 px-4 py-3 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/60 dark:text-zinc-400">
        <Database size={13} className="mt-0.5 shrink-0" />
        Metadata dari portal {SITE_NAME} — sumber asli: data.go.id. Ketersediaan berkas sepenuhnya ditentukan penerbit
        dataset; jumlah resource: {formatNumber(detail.resources.length)}.
      </p>
    </div>
  );
}
