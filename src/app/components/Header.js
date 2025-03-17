import Link from 'next/link';

export default function Header() {
    return (
        <header className="bg-transparent text-white p-2 fixed top-0 left-0 right-0">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p className="text-xl font-bold  ">FlixVault</p>
            <nav className="space-x-4">
            <Link href="/login" className="hover:underline">
                Log In
            </Link>
            <Link href="/" className="hover:underline">
                Home
            </Link>
            <Link href="/diary" className="hover:underline">
                Diary
            </Link>
            <Link href="/lists" className="hover:underline">
                Lists
            </Link>
            <Link href="/recommendations" className="hover:underline">
                Recommendations
            </Link>
            </nav>
          </div>
        </header>
      );
}