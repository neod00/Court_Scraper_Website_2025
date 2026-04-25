import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface CarValuationResult {
    vehicle_summary: {
        model: string;
        year: number | null;
        mileage_km: number | null;
        color: string | null;
        fuel_type: string | null;
    };
    market_price: {
        dealer_buy_min: number;
        dealer_buy_max: number;
        market_sell_min: number;
        market_sell_max: number;
        private_sale_min: number;
        private_sale_max: number;
        new_car_price: number | null;
    };
    investment_analysis: {
        score: number;
        grade: string;
        expected_profit_min: number;
        expected_profit_max: number;
        roi_min: number;
        roi_max: number;
    };
    checkpoints: string[];
    analysis_text: string;
    sources: {
        name: string;
        detail: string;
        price: string;
        url: string;
    }[];
    conclusion: string;
    analyzed_at: string;
}

const SYSTEM_PROMPT = `당신은 한국 중고차 시장 전문 분석가입니다. 사용자가 제공하는 차량 정보를 바탕으로 현재 한국 중고차 시장 시세를 정확하게 분석해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "vehicle_summary": {
    "model": "차량 모델명 (예: BMW X3 xDrive 20d)",
    "year": 연식(숫자 또는 null),
    "mileage_km": 주행거리(숫자, km 단위, 또는 null),
    "color": "색상 또는 null",
    "fuel_type": "연료 타입 또는 null"
  },
  "market_price": {
    "dealer_buy_min": 딜러 매입 최저가(만원 단위 숫자),
    "dealer_buy_max": 딜러 매입 최고가(만원 단위 숫자),
    "market_sell_min": 중고차 시장 최저가(만원 단위 숫자),
    "market_sell_max": 중고차 시장 최고가(만원 단위 숫자),
    "private_sale_min": 개인 직거래 최저가(만원 단위 숫자),
    "private_sale_max": 개인 직거래 최고가(만원 단위 숫자),
    "new_car_price": 신차 출고가(만원 단위 숫자, 모르면 null)
  },
  "investment_analysis": {
    "score": 투자매력도 점수(0-100),
    "grade": "매우 높음/높음/보통/낮음/매우 낮음",
    "expected_profit_min": 예상 최소 수익(만원),
    "expected_profit_max": 예상 최대 수익(만원),
    "roi_min": 예상 최소 수익률(%),
    "roi_max": 예상 최대 수익률(%)
  },
  "checkpoints": ["낙찰 전 반드시 확인해야 할 사항 3-5개"],
  "analysis_text": "전문가 분석 의견 (반드시 3-4개의 문단으로 나누어 작성하고, 문단 사이에는 줄바꿈을 2번 하세요. 차량 특성, 시세 판단 근거, 투자 시 주의사항을 상세히 포함해야 합니다)",
  "sources": [
    {
      "name": "출처명 (KB차차차, 엔카, K Car 등)",
      "detail": "참고한 매물 정보 (연식/주행거리 등)",
      "price": "해당 매물 가격",
      "url": "해당 사이트 검색 URL"
    }
  ],
  "conclusion": "최종 투자 판단 요약 (2-3문장)"
}

중요 규칙:
1. 시세는 반드시 한국 중고차 시장(KB차차차, 엔카, K Car, 보배드림 등) 기준으로 분석하세요.
2. 출처(sources)에는 실제 확인 가능한 사이트명과 검색 URL을 포함하세요.
3. 매각가격이 제공되면 이를 기준으로 투자 수익률을 계산하세요.
4. checkpoints에는 해당 차종의 고질적 결함이나 주의사항을 구체적으로 포함하세요.
5. 모든 가격은 만원 단위 숫자로 입력하세요 (예: 3400 = 3,400만원).
6. analysis_text는 반드시 300자 이상으로 상세하게 작성하세요.`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { vehicleInfo, auctionPrice, manualInput } = body;

        if (!vehicleInfo && !manualInput) {
            return NextResponse.json(
                { success: false, error: '차량 정보가 필요합니다.' },
                { status: 400 }
            );
        }

        // Build user prompt
        let userPrompt = '';

        if (manualInput) {
            // Mode B: Manual input
            const { manufacturer, model, year, mileage, fuelType } = manualInput;
            userPrompt = `다음 차량의 현재 중고차 시세를 분석해주세요:\n`;
            userPrompt += `- 제조사: ${manufacturer || '미입력'}\n`;
            userPrompt += `- 모델명: ${model || '미입력'}\n`;
            userPrompt += `- 연식: ${year || '미입력'}년\n`;
            userPrompt += `- 주행거리: ${mileage ? mileage + 'km' : '미입력'}\n`;
            userPrompt += `- 연료: ${fuelType || '미입력'}\n`;
            if (auctionPrice) {
                userPrompt += `- 법원 매각가(공매 가격): ${auctionPrice}만원\n`;
            }
        } else {
            // Mode A: Auto from AI summary
            userPrompt = `다음은 법원 자산매각 공고에서 추출한 차량 정보입니다. 이 차량의 현재 중고차 시세를 분석해주세요:\n\n`;
            userPrompt += vehicleInfo;
            if (auctionPrice) {
                userPrompt += `\n\n법원 매각가(공매 최저가격): ${auctionPrice}만원`;
            }
        }

        userPrompt += `\n\n위 정보를 기반으로 KB차차차, 엔카, K Car 등 한국 주요 중고차 플랫폼의 현재 시세를 조사하고, 투자 매력도를 분석해주세요.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-5.4',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_completion_tokens: 2500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json(
                { success: false, error: 'AI 응답이 비어있습니다.' },
                { status: 500 }
            );
        }

        const result: CarValuationResult = {
            ...JSON.parse(content),
            analyzed_at: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Car valuation error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message || '시세 분석 중 오류가 발생했습니다.',
            },
            { status: 500 }
        );
    }
}
