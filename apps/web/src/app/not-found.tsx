import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Səhifə tapılmadı</p>
        <Link href="/" className="text-red-600 hover:underline font-medium">
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}
