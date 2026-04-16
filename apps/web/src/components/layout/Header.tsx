import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-red-600 tracking-tight">
          CarAZ
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/listings" className="text-gray-700 hover:text-gray-900">
            Elanlar
          </Link>
          <Link href="/dealers" className="text-gray-700 hover:text-gray-900">
            Salonlar
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/listings/new"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Elan yerləşdir
          </Link>
          <Link
            href="/auth/login"
            className="text-gray-700 hover:text-gray-900 text-sm font-medium"
          >
            Giriş
          </Link>
        </div>
      </div>
    </header>
  );
}
