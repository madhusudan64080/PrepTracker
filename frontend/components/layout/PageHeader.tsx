// frontend/components/layout/PageHeader.tsx

"use client";

import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumb?: Breadcrumb[];
  actions?: ReactNode;
  backHref?: string;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  backHref
}: Props) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <div className="flex items-center text-sm text-[#94a3b8] mb-2">
          {breadcrumb.map((b, i) => (
            <span key={b.href} className="flex items-center gap-1">
              <Link href={b.href}>{b.label}</Link>
              {i < breadcrumb.length - 1 && <ChevronRight size={14} />}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded hover:bg-white/10"
            >
              <ArrowLeft size={18} />
            </Link>
          )}

          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[#94a3b8]">{subtitle}</p>
            )}
          </div>
        </div>

        <div>{actions}</div>
      </div>
    </div>
  );
}