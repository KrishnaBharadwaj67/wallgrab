import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full animate-fade-in">
      <div className="text-center max-w-lg px-6">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border border-accent-purple/20 animate-pulse" />
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-accent-purple/10 to-accent-cyan/5 flex items-center justify-center">
            <svg className="w-10 h-10 text-accent-purple/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          {/* Orbiting dot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-cyan/50 animate-spin-slow" style={{ transformOrigin: '0 48px' }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Grab wallpapers from <span className="gradient-text">any website</span>
        </h2>

        {/* Description */}
        <p className="text-surface-400 text-sm leading-relaxed mb-8">
          Paste a URL from your favorite wallpaper site above. WallGrab will scan the page,
          find all wallpapers, and let you download them in the highest quality available.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { icon: '⚡', label: 'Rust-powered' },
            { icon: '🔍', label: 'Smart extraction' },
            { icon: '📐', label: 'Full resolution' },
            { icon: '🎨', label: 'Any website' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="glass rounded-full px-4 py-1.5 text-xs font-medium text-surface-300
                         flex items-center gap-1.5 hover:border-accent-purple/30 transition-colors"
            >
              <span>{feature.icon}</span>
              {feature.label}
            </div>
          ))}
        </div>

        {/* Supported sites hint */}
        <div className="mt-8 pt-6 border-t border-white/[0.04]">
          <p className="text-surface-600 text-xs mb-3">Works great with</p>
          <div className="flex items-center justify-center gap-4 text-surface-500 text-xs font-mono">
            <span className="hover:text-accent-purple transition-colors cursor-default">unsplash.com</span>
            <span className="text-surface-800">•</span>
            <span className="hover:text-accent-purple transition-colors cursor-default">wallhaven.cc</span>
            <span className="text-surface-800">•</span>
            <span className="hover:text-accent-purple transition-colors cursor-default">pexels.com</span>
            <span className="text-surface-800">•</span>
            <span className="hover:text-accent-purple transition-colors cursor-default">& more</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
