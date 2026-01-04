import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// In a real app, this might come from a DB or CMS. 
// For AdSense, static generation or high-quality static content is key.
const guideContent = {
    'rehabilitation-asset-guide': {
        title: '회생 절차 중인 기업의 자산을 저렴하게 매수하는 법',
        date: '2025.01.04',
        category: '입찰 전략',
        image: '/images/guides/rehab-asset-guide.png',
        content: `
            <div class="article-section">
                <p>경제 상황이 불안정할수록 기업의 회생 신청은 증가하고 있습니다. 많은 이들이 이러한 과정을 부정적으로만 바라보지만, 회생 절차는 단순한 도산이 아니라 다시 일어서기 위한 재정비의 시간이며, 그 과정에서 기업은 불필요하거나 비핵심적인 자산을 매각하게 됩니다.</p>
                <p>이때 나오는 <strong style="background-color: #ffffcc; padding: 2px 6px; border-radius: 3px;">‘회생 자산’</strong>은 시장가보다 낮은 가격으로 나오는 경우가 많아, 예비 창업자, 투자자, 사업 확장을 원하는 기업들에게 매우 좋은 기회를 제공합니다.</p>
                <p>이 글에서는 회생 절차 기업의 자산을 어떻게 하면 <strong>법적 리스크 없이 안전하게</strong>, 그리고 <strong>남들보다 싸게 확보</strong>할 수 있는지 그 방법과 전략을 구체적으로 설명합니다. 공매나 경매보다 더 복잡한 회생 자산 매각 구조를 이해하고, 실무에서 자주 발생하는 오류들을 사전에 차단할 수 있는 체크리스트와 실제 낙찰 사례, 전략까지 안내해드립니다.</p>
                <p>핵심은 <strong style="background-color: #ffffcc; padding: 2px 6px; border-radius: 3px;">정보의 선점과 절차 이해</strong>입니다. 가격이 아무리 낮아도 리스크를 통제하지 못하면 오히려 손해를 볼 수 있습니다. 그러나 전략을 알고 접근하면 회생 자산 매입은 놓쳐서는 안 될 절호의 기회가 됩니다.</p>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background-color: #eef5ff;">회생 자산 매각은 왜 기회인가?</h2>
            <div class="article-section">
                <p>회생 절차에 들어간 기업은 부채를 줄이고 사업을 정상화하기 위해 자산을 매각해야 합니다. 법원의 감독 아래 이뤄지는 절차이기 때문에 불법적인 요소가 개입할 여지가 적고, 자산의 소유권 문제도 비교적 정리되어 있는 경우가 많습니다.</p>
                <p>특히 <strong>현금 확보가 시급한 기업</strong>들은 자산을 <strong>시세보다 낮은 가격</strong>에 매각하는 경향이 있어, 부동산, 기계설비, 차량, 상표권, 특허, 영업권 등 다양한 자산을 저렴하게 확보할 수 있습니다.</p>
                <p>단기 자산 확보 또는 사업 확장을 노리는 투자자에게는 매우 유리한 조건이라 할 수 있습니다.</p>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background-color: #eef5ff;">일반 경매와 회생 자산 매각의 차이</h2>
            <div class="article-section">
                <p>일반 경매와 회생 자산 매각은 겉보기에는 비슷하지만, 절차상 구조는 다릅니다.</p>
                <ul>
                    <li><strong>일반 경매:</strong> 채권자의 신청으로 법원이 강제 집행</li>
                    <li><strong>회생 매각:</strong> 법원과 관재인이 주도, 회생계획에 따라 진행</li>
                </ul>
                <p>일반 경매는 등기부 권리분석이 중요하며, 회생 매각은 비교적 권리관계가 정리되어 있는 경우가 많지만, <strong>모든 자산이 안전한 것은 아니므로 사전 확인은 필수</strong>입니다.</p>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background-color: #eef5ff;">회생 자산 매입의 장점</h2>
            <div class="article-section">
                <ul>
                    <li><strong>1. 낮은 매입가:</strong> 감정가의 60~70% 수준에서도 낙찰 가능</li>
                    <li><strong>2. 법적 안정성:</strong> 법원 감독하에 권리 관계 정리로 리스크 최소화</li>
                    <li><strong>3. 자산 다양성:</strong> 부동산 외에도 차량, 기계, 특허 등 매입 가능</li>
                </ul>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background-color: #eef5ff;">입찰 전에 반드시 확인해야 할 체크리스트</h2>
            <div class="article-section">
                <ul>
                    <li><strong>1. 매각 허가 조건:</strong> 법원의 승인 여부 및 조건 확인</li>
                    <li><strong>2. 현장 실사:</strong> 실물 확인으로 자산 상태 점검 필수</li>
                    <li><strong>3. 자금 준비:</strong> 빠른 납부 기한에 대비한 자금 확보 필요</li>
                    <li><strong>4. 권리관계 확인:</strong> 등기부등본, 권리분석 보고서로 저당권 등 확인</li>
                </ul>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background-color: #eef5ff;">회생 자산 낙찰을 위한 성공 전략</h2>
            <div class="article-section">
                <ul>
                    <li><strong>1. 정보 선점:</strong> 회생 법원, 온비드, 경매 사이트를 통한 실시간 확인</li>
                    <li><strong>2. 관재인과 소통:</strong> 매각 조건과 일정 등을 관재인을 통해 파악</li>
                    <li><strong>3. 경쟁 적은 물건 노리기:</strong> 회생 자산은 일반 경매보다 경쟁률이 낮음</li>
                    <li><strong>4. 유사 사례 분석:</strong> 이전 낙찰가를 참고해 입찰가 전략 수립</li>
                </ul>
            </div>
        `
    },
    'bankruptcy-vs-auction': {
        title: '파산 관재인 매각과 일반 경매의 차이점',
        date: '2025.01.03',
        category: '기초 지식',
        image: '/images/guides/bankruptcy-vs-auction_v2.png',
        content: `
            <p>부동산이나 기업 자산 시세보다 저렴하게 취득하려는 많은 분들이 <strong style="background-color: #ffffcc; padding: 2px 6px; border-radius: 3px;">‘경매’나 ‘공매’</strong>를 먼저 떠올리지만, 사실 이보다 더 중요한 개념이 있습니다. 바로 <strong style="background-color: #ffffcc; padding: 2px 6px; border-radius: 3px;">‘파산 관재인 매각’</strong>입니다.</p>
            <p>이는 채무자 회생 및 파산에 관한 법률에 따라 파산 절차에서 진행되는 매각 방식으로, 일반적인 경매와는 그 구조와 절차가 다릅니다. 특히 부동산 투자나 자산 매입을 계획 중이라면, 이 두 방식의 차이를 정확히 이해하는 것이 매우 중요합니다. 그 이유는 바로 <strong>낙찰 후의 권리 보호, 인도, 소유권 이전 등 실질적 리스크</strong>가 달라지기 때문입니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">법적 근거부터 다르다</h2>
            <p>일반 경매는 <strong>민사집행법</strong>에 따라 채권자가 법원에 신청하면서 시작됩니다. 반면 파산 관재인 매각은 <strong>회생 및 파산법</strong>에 근거하며, 법원이 선임한 관재인이 자산 매각을 수행합니다.</p>
            <p>이처럼 매각의 목적과 법적 근거부터 다르기 때문에, 접근 방식과 리스크 관리 방법도 완전히 다르게 접근해야 합니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">매각 주체가 다르다</h2>
            <ul>
                <li><strong>일반 경매:</strong> 법원 경매계가 직접 진행하며, 채권자가 시작합니다.</li>
                <li><strong>파산 매각:</strong> 법원이 지정한 <strong>파산 관재인</strong>이 매각 주체로 활동합니다.</li>
            </ul>
            <p>관재인은 채무자의 모든 자산을 정리하고, 이를 공정하게 매각하여 채권자에게 배분하는 임무를 맡습니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">입찰 방식의 유연성 차이</h2>
            <p>일반 경매는 <strong>기일 입찰 방식</strong>으로 절차와 일정이 고정되어 있습니다. 반면 파산 매각은 <strong>공개 입찰은 물론 수의계약도 가능</strong>해 유연하게 협상이 가능합니다.</p>
            <p>이러한 유연성 덕분에 빠르게 정보를 선점하고 관재인과 협상할 경우, 경쟁 없이 좋은 조건에 자산을 확보할 수 있습니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">인도 명령 vs 명도 소송</h2>
            <ul>
                <li><strong>일반 경매:</strong> 낙찰 후 인도 명령을 통해 빠른 점유자 퇴거 가능</li>
                <li><strong>파산 매각:</strong> 인도 명령이 불가능해 <strong>명도소송</strong>이 필요할 수 있음</li>
            </ul>
            <p>이 때문에 파산 자인을 매입할 경우, 반드시 <strong>현재 점유 상태</strong>를 관재인을 통해 사전 확인하고 리스크를 줄여야 합니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">권리관계 정리 방식의 차이</h2>
            <p>일반 경매는 <strong>등기부 권리 분석</strong>이 핵심입니다. 반면 파산 매각은 관재인이 자산을 정리하며 대부분 권리를 해결한 상태로 매각하지만, <strong>계약에 따라 일부 권리는 인수될 수도 있으므로 반드시 확인</strong>이 필요합니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">실제 매수 전략 차이</h2>
            <ul>
                <li><strong>일반 경매:</strong> 시세 조사와 낙찰가 예측 중심의 입찰 전략</li>
                <li><strong>파산 매각:</strong> 관재인과의 협상력 + 정보력 중심의 전략</li>
            </ul>
            <p>수의계약을 통해 <strong>경쟁 없는 낙찰</strong>이 가능한 경우도 많으므로, <strong>미리 접촉하고 협의</strong>하는 것이 매우 중요합니다.</p>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">요약 비교 표</h2>
            <div class="overflow-x-auto">
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #fff;">
                    <thead>
                        <tr style="background-color: #f2f2f2; font-weight: bold;">
                            <th style="border: 1px solid #ccc; padding: 12px; text-align: center;">항목</th>
                            <th style="border: 1px solid #ccc; padding: 12px; text-align: center;">일반 경매</th>
                            <th style="border: 1px solid #ccc; padding: 12px; text-align: center;">파산 관재인 매각</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">법적 근거</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">민사집행법</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">채무자 회생 및 파산법</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">매각 주체</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">법원 경매계</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">파산 관재인</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">입찰 방식</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">공개 입찰 (기일 고정)</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">공개 입찰 + 수의계약 가능</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">인도 절차</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">인도 명령 가능</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">명도소송 필요 가능성</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">협상 가능성</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">낮음</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">있음</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">권리 정리</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">등기부 기준</td>
                            <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">관재인 정리 후 매각</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; margin-top: 40px; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff;">마우리</h2>
            <p>
                파산 관재인 매각은 일반 경매보다 절차가 복잡할 수 있지만, <strong>정보 접근성과 협상 기회</strong> 면에서는 훨씬 유리할 수 있습니다. 다만, 인도 문제나 권리 분석은 더 까다로울 수 있으므로, <strong>전문가 자문을 받거나 관재인과 충분한 소통을 통해 리스크를 최소화하는 전략</strong>이 필요합니다.
            </p>
        `
    },
    'law-changes-2025': {
        title: '2026 투자 성공의 열쇠: 법원 매각 자산 취득을 위한 법률 리스크 제로 전략',
        date: '2025.01.01',
        category: '법규 소식',
        image: '/images/guides/law-changes-2025_v2.png',
        content: `
            <p>
                2026년의 자산 시장은 그 어느 때보다 역동적입니다. 고금리 기조의 여파로 가계와 기업의 재무 부담이 가중되면서, <strong>법원을 통해 매각되는 회생·파산 자산</strong>의 공급이 급증하고 있습니다.
                이는 준비된 투자자에게는 시세보다 현격히 낮은 가격에 우량 자산을 확보할 수 있는 <strong>일생일대의 기회</strong>가 되겠지만, 법률적 리스크를 간과한 이들에게는 예상치 못한 손실의 덫이 될 수도 있습니다.
            </p>
            <p>
                본 가이드에서는 2026년 변화된 제도적 환경 속에서 <strong>법적 리스크를 ‘제로(Zero)’화</strong>하고 투자 성공의 열쇠를 쥐기 위한 전략을 심층적으로 소개합니다.
            </p>

            <h2 style="font-size: 22px; color: #0056b3; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff; margin-top: 40px;">I. 2026년 자산 매각 시장의 새로운 패러다임</h2>

            <h3 style="font-size: 18px; margin-top: 30px; color: #007BFF;">1. 공급의 양적·질적 확대</h3>
            <p>
                회생·파산 법인의 자산 매각은 일반 경매와 달리 담보권자뿐 아니라 관리인이 주도하는 경우가 많습니다. 특히 2026년에는 <strong>IT, 바이오, 제조 분야의 유망 테크 기업</strong>들이 재구조화 과정에서 내놓는 
                <strong>영업권 및 특허권 결합 매물</strong>이 증가하고 있습니다.
            </p>
            <p>
                이는 단순한 부동산 투자 이상으로, 사업적 시너지를 추구하는 투자자에게 최적의 환경입니다.
            </p>

            <h3 style="font-size: 18px; margin-top: 30px; color: #007BFF;">2. 법적 절차의 투명성 강화</h3>
            <p>
                2026년부터 사법당국은 매각 공고 기준을 더욱 엄격히 적용하며, 배수 기준과 입찰 방식에 투명성을 강화하고 있습니다. 
                이는 투자자가 허위 매물이나 작전성 입찰에 노출될 가능성이 줄어들었음을 의미하며,
                <strong>데이터 기반 분석과 공고 검토 역량</strong>이 투자 성패를 좌우하게 되었습니다.
            </p>

            <h2 style="font-size: 22px; color: #0056b3; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff; margin-top: 40px;">II. 리스크 제로를 위한 3단계 법률 검토 전략</h2>

            <div style="background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="font-size: 18px; color: #007BFF; margin-top: 0;">Step 1. 권리 분석의 ‘현미경 검증’</h3>
                <p>
                    회생 자산은 등기부 권리 외에도 <strong>회생채권 및 공익채권</strong>을 반드시 검토해야 합니다.
                    공익채권(임금, 조세 등)은 낙찰 후 <strong>일반 채권보다 우선 배당</strong>되기 때문에 예상과 다른 순위로 낙찰가가 불리해질 수 있습니다.
                    자동화된 권리 분석 시스템을 통해 <strong>권리 변동 내역을 실시간 추적</strong>하는 것이 핵심입니다.
                </p>
            </div>

            <div style="background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="font-size: 18px; color: #007BFF; margin-top: 0;">Step 2. ‘인도 명령 vs 명도 소송’ 시나리오 구축</h3>
                <p>
                    파산 관재인 매각은 일반 경매와 달리 <strong>인도 명령 제도가 적용되지 않으며</strong>, 점유자 퇴거가 쉽지 않을 수 있습니다.
                    <strong>현장 점유자와의 사전 협상 능력</strong>이 핵심이며, 퇴거 의사와 소송 리스크를 관재인을 통해 사전에 확인해야 합니다.
                    소요되는 <strong>명도 비용과 시간</strong>은 반드시 입찰가에 반영하십시오.
                </p>
            </div>

            <div style="background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="font-size: 18px; color: #007BFF; margin-top: 0;">Step 3. 자금 조달 리스크 차단</h3>
                <p>
                    회생 자산은 일반 경매보다 <strong>잔금 납부 기한이 짧은 경우가 많으며</strong>, 2026년 금융 규제로 인해 대출 승인도 지연될 수 있습니다.
                    입찰 전 <strong>확약된 대출 한도 확보</strong>는 필수이며, 자금 부족으로 <strong>보증금 몰수</strong>되는 일이 없도록 해야 합니다.
                </p>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff; margin-top: 40px;">III. 성공 투자를 위한 실전 체크리스트</h2>
            <div style="background-color: #e9f7ef; border-left: 5px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <ul>
                    <li><strong>매각 공고 해석:</strong> '현황 매각' vs '권리 보증 매각'의 문구 차이 해석 필수</li>
                    <li><strong>특수 권리 확인:</strong> 유치권, 법정지상권, 분묘기지권 등 비등기 권리 현장 점검</li>
                    <li><strong>세무 리스크:</strong> 취득세 중과 및 감면 조건, 법인 이전 시 세금 이슈 반드시 확인</li>
                </ul>
            </div>

            <h2 style="font-size: 22px; color: #0056b3; border-left: 5px solid #007BFF; padding-left: 15px; background: #eef5ff; margin-top: 40px;">IV. 맺음말: 정보가 곧 수익인 시대</h2>
            <div style="background-color: #e0ecff; border-left: 5px solid #007BFF; padding: 20px; margin-top: 40px; border-radius: 6px;">
                <p>
                    2026년의 법원 매각 자산 시장은 <strong>전략과 정보가 승부를 가르는 시장</strong>입니다.
                    단순히 ‘운’이 아닌, <strong>법률 지식 + 실시간 데이터</strong>가 결합된 투자자만이 성공할 수 있습니다.
                </p>
                <p>
                    리스크를 회피하기보다는 <strong>통제하고 활용할 수 있는 전략</strong>을 세워야 진정한 수익으로 이어질 수 있습니다.
                </p>
                <p>
                    <strong>대법원 회생·파산 자산매각 자동조회 시스템</strong>을 통해 지금 바로 최신 공고를 확인해보세요.
                    성공 투자의 시작은 정보에서 출발합니다.
                </p>
            </div>
        `
    }
};

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const article = guideContent[slug as keyof typeof guideContent];

    return {
        title: article ? `${article.title} | 자산매각 가이드` : '가이드를 찾을 수 없습니다',
        description: article ? article.title + '에 대한 전문 가이드입니다.' : '가이드 정보를 찾을 수 없습니다.',
    };
}

export default async function GuideDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const article = guideContent[slug as keyof typeof guideContent];

    if (!article) {
        notFound();
    }

    return (
        <article className="max-w-4xl mx-auto px-4 py-8">
            <Link
                href="/guide"
                className="inline-flex items-center text-indigo-600 font-medium mb-8 hover:translate-x-[-4px] transition-transform"
            >
                ← 가이드 목록으로 돌아가기
            </Link>

            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                        {article.category}
                    </span>
                    <span className="text-gray-400 text-sm">{article.date}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-8">
                    {article.title}
                </h1>
                <div className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </header>

            <div
                className="prose prose-lg prose-indigo max-w-none text-gray-700 leading-relaxed
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-strong:text-indigo-900 prose-ul:list-disc prose-li:mb-2"
                dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <footer className="mt-16 pt-8 border-t border-gray-200">
                <div className="bg-indigo-50 rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-xl font-bold text-indigo-900 mb-2">도움이 되셨나요?</h4>
                        <p className="text-indigo-700">본 서비스는 매일 새로운 법원 매각 공고를 업데이트합니다.</p>
                    </div>
                    <Link
                        href="/"
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
                    >
                        최신 매각 공고 보러가기
                    </Link>
                </div>
            </footer>
        </article>
    );
}
