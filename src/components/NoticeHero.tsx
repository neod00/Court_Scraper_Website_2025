import Badge from './Badge';

interface NoticeHeroProps {
    notice: {
        title: string;
        category: string;
        court_name: string;
        date_posted: string;
        department?: string;
    };
}

export default function NoticeHero({ notice }: NoticeHeroProps) {
    const isRealEstate = notice.category === 'real_estate';
    const isVehicle = notice.category === 'vehicle';
    
    // Category-based premium background images
    const bgImages: Record<string, string> = {
        real_estate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
        vehicle: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&q=80&w=1200',
        other: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200'
    };

    const bgImage = bgImages[notice.category] || bgImages.other;

    return (
        <div className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden mb-8 shadow-xl">
            {/* Background Image with Parallax-like effect */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Content Overlay - Glassmorphism */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <div className="max-w-4xl">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge color={isRealEstate ? 'blue' : (isVehicle ? 'green' : 'gray')}>
                            {isRealEstate ? '🏢 부동산' : (isVehicle ? '🚗 차량/동산' : '📦 기타자산')}
                        </Badge>
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white md:text-xs text-[10px] font-bold border border-white/30">
                            {notice.court_name}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-indigo-600/40 backdrop-blur-md text-white md:text-xs text-[10px] font-bold border border-indigo-400/30">
                             공고일: {notice.date_posted}
                        </span>
                    </div>
                    
                    <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        {notice.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-gray-200 text-sm md:text-base font-medium">
                        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-indigo-400">⚖️</span>
                            <span>{notice.department || '관할 법원 정보 없음'}</span>
                        </div>
                        <div className="hidden md:flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-yellow-400">📊</span>
                            <span>회생/파산 자산매각 리포트 v1.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Indicator Area */}
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                 <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white flex flex-col items-center">
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">매각상태</span>
                     <span className="text-indigo-600 font-black text-lg">진행중</span>
                 </div>
            </div>
        </div>
    );
}
