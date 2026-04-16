import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-white font-bold text-lg mb-3">CarAZ</div>
            <p className="text-sm">Azərbaycanda avtomobil alqı-satqısı</p>
          </div>
          <div>
            <div className="text-white font-semibold mb-3 text-sm">Platformа</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/listings" className="hover:text-white">Elanlar</Link></li>
              <li><Link href="/dealers" className="hover:text-white">Salonlar</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-3 text-sm">Hesab</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/register" className="hover:text-white">Qeydiyyat</Link></li>
              <li><Link href="/auth/login" className="hover:text-white">Giriş</Link></li>
              <li><Link href="/listings/new" className="hover:text-white">Elan yerləşdir</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-3 text-sm">Əlaqə</div>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:info@caraz.az" className="hover:text-white">info@caraz.az</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-xs text-center">
          © {new Date().getFullYear()} CarAZ. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  );
}
