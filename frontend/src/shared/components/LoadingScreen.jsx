/**
 * LoadingScreen — Full-page loading indicator
 * Shown while AuthContext checks the session on initial mount
 */
const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Brand logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700
                        flex items-center justify-center shadow-glow animate-pulse">
          <span className="text-white font-black text-2xl">F</span>
        </div>

        {/* Bouncing dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary-500"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>

        <p className="text-gray-500 text-sm">Loading FlatSell...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
