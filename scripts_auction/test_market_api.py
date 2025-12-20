
import requests
import xml.etree.ElementTree as ET

def test_market_price_api():
    print("Testing Data.go.kr Real Estate Transaction API...")
    
    # Endpoint provided by user image
    url = "http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"
    
    # User's Service Key
    service_key = "3d5ffc75a14cccb5038feb87bbf1b03f36591801bd4469fbfaf1d39f90a62ff8"
    
    # Parameters for Gwanak-gu (11620), October 2024
    params = {
        'serviceKey': service_key,
        'LAWD_CD': '11620',
        'DEAL_YMD': '202410'
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Response Content (First 500 chars):")
            print(response.content[:500].decode('utf-8'))
            
            # Parse XML
            root = ET.fromstring(response.content)
            items = root.findall('.//item')
            print(f"\nFound {len(items)} transactions for Gwanak-gu in Oct 2024.")
            
            if items:
                print("\nExample Item XML:")
                print(ET.tostring(items[0], encoding='unicode'))
            
            for item in items[:5]:
                apt = item.findtext('aptNm', 'N/A')
                amount = item.findtext('dealAmount', '0')
                area = item.findtext('excluArea', '0')
                day = item.findtext('dealDay', '0')
                dong = item.findtext('umdNm', '')
                build_year = item.findtext('buildYear', '')
                print(f" - {dong} {apt} ({build_year}년) | {day}일 | {amount.strip()}만원 | {area}㎡")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_market_price_api()
