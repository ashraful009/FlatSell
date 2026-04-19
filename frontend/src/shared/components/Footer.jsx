import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Browse Properties', path: '/properties' },
    { label: 'Companies',         path: '/companies' },
    { label: 'Become a Vendor',   path: '/become-vendor' },
  ],
  Account: [
    { label: 'Register', path: '/register' },
    { label: 'Login',    path: '/login' },
  ],
};

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-dark-950/80 mt-auto">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700
                              flex items-center justify-center shadow-glow">
                <span className="text-white font-black text-base">F</span>
              </div>
              <span className="text-xl font-black text-white">
                Flat<span className="text-gradient">Sell</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The #1 multi-vendor real estate marketplace. Browse, compare and book
              apartments from verified companies — all in one place.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {[
                { label: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                { label: 'Twitter',  icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'LinkedIn', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
              ].map(({ label, icon }) => (
                <a key={label} href="#" aria-label={label}
                   className="w-9 h-9 rounded-lg bg-white/5 border border-white/10
                              flex items-center justify-center text-gray-400
                              hover:text-white hover:bg-white/10 hover:border-white/20
                              transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor"
                       viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold text-sm mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="text-gray-400 hover:text-white text-sm
                                 transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row
                        items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            © {year} FlatSell. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service'].map((t) => (
              <a key={t} href="#"
                 className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
