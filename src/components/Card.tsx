import Link from 'next/link';
import { ReactNode } from 'react';

type CardProps = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

export default function Card({ title, description, href, icon }: CardProps) {
  return (
    <Link
      href={href}
      className="block bg-finance-800/80 border border-finance-700 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-accent-500/50 transform hover:-translate-y-1 transition ease-out duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-finance-900 animate-fade-in backdrop-blur-sm"
    >
      <div className="flex items-center mb-4">
        {icon}
        <div className="ml-4 text-xl font-semibold text-finance-100 group-hover:text-accent-400 transition-colors">
          {title}
        </div>
      </div>
      <p className="text-finance-300 text-sm mb-6">{description}</p>
      <div className="inline-flex items-center text-accent-500 font-medium">
        Essayer
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 ml-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </Link>
  );
}
