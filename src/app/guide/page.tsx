import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { isPublicGuideSlug } from '@/lib/contentPolicy';

export const metadata: Metadata = {
    title: '자산매각 가이드 | LawAuction',
    description: '회생·파산 자산매각 공고를 읽을 때 확인해야 할 절차와 자료를 안내합니다.',
    alternates: { canonical: '/guide' },
    robots: { index: false, follow: true },
};

export const guides = [
    {
        slug: 'rehabilitation-asset-guide',
        title: '회생 절차 중 기업 자산매각 공고 확인 방법',
        description: '기업 회생 절차에서 매각되는 자산의 공고와 계약조건 확인 항목을 정리합니다.',
        image: '/images/guides/rehab-asset-guide.png',
        date: '2025.01.04',
        category: '입찰 전략'
    },
    {
        slug: 'bankruptcy-vs-auction',
        title: '파산 관재인 매각과 일반 경매의 차이점',
        description: '파산 관재인이 주도하는 매각 방식은 일반 경매와 무엇이 다를까요? 장단점을 비교해 드립니다.',
        image: '/images/guides/bankruptcy-vs-auction_v2.png',
        date: '2025.01.03',
        category: '기초 지식'
    },
    {
        slug: 'law-changes-2025',
        title: '2026 투자 성공의 열쇠: 법원 매각 자산 취득을 위한 법률 리스크 제로 전략',
        description: '2026년 변화하는 자산 매각 환경에서 법률적 리스크를 완벽하게 통제하고 성공적인 투자 수익을 거두는 핵심 전략을 공개합니다.',
        image: '/images/guides/law-changes-2025_v2.png',
        date: '2025.01.01',
        category: '법규 소식'
    }
];

export default function GuideListPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 자산매각 가이드</h1>
                <p className="text-lg text-gray-600">
                    법원 회생·파산 자산매각 공고를 확인할 때 필요한 일반 정보를 제공합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {guides.filter((guide) => isPublicGuideSlug(guide.slug)).map((guide) => (
                    <Link
                        key={guide.slug}
                        href={`/guide/${guide.slug}`}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="relative h-56 w-full">
                            <Image
                                src={guide.image}
                                alt={guide.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    {guide.category}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-sm text-gray-500 mb-2">{guide.date}</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                {guide.title}
                            </h2>
                            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                                {guide.description}
                            </p>
                            <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm">
                                자세히 읽어보기 <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
