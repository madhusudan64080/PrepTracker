// frontend/components/shared/SkeletonLoader.tsx

interface Props {
  variant: "card" | "text" | "text-block" | "avatar" | "chart" | "table-row";
}

export default function SkeletonLoader({ variant }: Props) {
  const base = "animate-pulse bg-white/5 rounded";

  const map = {
    card: "h-40 w-full",
    text: "h-4 w-32",
    "text-block": "h-20 w-full",
    avatar: "h-10 w-10 rounded-full",
    chart: "h-60 w-full",
    "table-row": "h-8 w-full"
  };

  return <div className={`${base} ${map[variant]}`} />;
}
