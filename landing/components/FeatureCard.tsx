import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
};

export function FeatureCard({ icon: Icon, title, description, badge }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-purple-500/50 transition-all group relative overflow-hidden">
      {badge && (
        <span className="absolute top-4 right-4 bg-purple-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="text-purple-400" size={28} />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
