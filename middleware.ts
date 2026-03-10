import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 보호할 기본 경로: 수동 스크래핑 등 서버 부하를 유발하는 API 엔드포인트 및 관리자 페이지
    const protectedPaths = ['/api/scrape', '/admin'];

    if (protectedPaths.some(path => pathname.startsWith(path))) {
        const authHeader = request.headers.get('authorization');
        const adminSecret = process.env.ADMIN_SECRET_KEY;

        // 환경 변수에 어드민 키가 설정되어 있을 때만 접근 허가 검사 수행
        // 설정되지 않은 경우 개발 편의를 위해 일단 차단하지 않지만 콘솔 서버 로그에 경고 기록 권장
        if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized access' },
                { status: 401 }
            );
        } else if (!adminSecret && process.env.NODE_ENV === 'production') {
            // 프로덕션인데 관리자 키가 설정되지 않았다면 보안 경고 차원에서 접근 거부 권장
            // 혹은 개발 단계에서는 바로 통과
            // console.warn('ADMIN_SECRET_KEY is not set in production');
        }
    }

    return NextResponse.next();
}

export const config = {
    // 모든 라우트에 대해 실행하되 명확히 제외되는 불필요한 이미지 에셋이나 웹팩 경로를 제외해도 됨
    // 여기선 구체적으로 어드민, API scrape에만 동작하도록 지정
    matcher: ['/api/scrape/:path*', '/admin/:path*'],
};
