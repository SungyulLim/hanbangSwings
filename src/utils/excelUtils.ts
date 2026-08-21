import * as XLSX from 'xlsx';
import type { Player, BattingStats, PitchingStats } from '../types';

export interface ParsedExcelResult {
  matchedPlayerIds: string[];
  battingData: Record<string, BattingStats>;
  pitchingData: Record<string, PitchingStats>;
  unmatchedRows: string[];
  totalRowsCount: number;
}

// 엑셀 템플릿 생성 및 다운로드
export function downloadGameRecordTemplate(players: Player[], gameTitle: string = '한방스윙스_경기기록') {
  const sortedPlayers = [...players].sort((a, b) => a.number - b.number);

  // 1. 타격 기록 시트 데이터
  const battingHeaders = [
    '등번호',
    '이름',
    '타석(PA)',
    '타수(AB)',
    '안타(H)',
    '2루타(2B)',
    '3루타(3B)',
    '홈런(HR)',
    '타점(RBI)',
    '득점(R)',
    '볼넷(BB)',
    '삼진(SO)',
    '도루(SB)',
  ];

  const battingRows = sortedPlayers.map(p => [
    p.number,
    p.name,
    0, // PA
    0, // AB
    0, // H
    0, // 2B
    0, // 3B
    0, // HR
    0, // RBI
    0, // R
    0, // BB
    0, // SO
    0, // SB
  ]);

  const battingSheetData = [battingHeaders, ...battingRows];

  // 2. 투구 기록 시트 데이터
  const pitchingHeaders = [
    '등번호',
    '이름',
    '투구이닝(IP)',
    '자책점(ER)',
    '실점(R)',
    '피안타(H)',
    '사사구(BB)',
    '탈삼진(SO)',
    '승(W)',
    '패(L)',
    '세이브(SV)',
  ];

  const pitchingRows = sortedPlayers.map(p => [
    p.number,
    p.name,
    0, // IP
    0, // ER
    0, // R
    0, // H
    0, // BB
    0, // SO
    0, // W
    0, // L
    0, // SV
  ]);

  const pitchingSheetData = [pitchingHeaders, ...pitchingRows];

  // 워크북 생성
  const wb = XLSX.utils.book_new();

  const wsBatting = XLSX.utils.aoa_to_sheet(battingSheetData);
  // 열 너비 설정
  wsBatting['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 9 },
    { wch: 10 }, { wch: 10 }, { wch: 9 }, { wch: 10 }, { wch: 9 },
    { wch: 10 }, { wch: 10 }, { wch: 9 }
  ];

  const wsPitching = XLSX.utils.aoa_to_sheet(pitchingSheetData);
  wsPitching['!cols'] = [
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 9 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 7 }, { wch: 7 }, { wch: 10 }
  ];

  XLSX.utils.book_append_sheet(wb, wsBatting, '타격기록');
  XLSX.utils.book_append_sheet(wb, wsPitching, '투구기록');

  // 파일 다운로드
  const sanitizedTitle = gameTitle.replace(/[/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(wb, `${sanitizedTitle}_기록입력양식.xlsx`);
}

// 엑셀 파일 읽기 및 파싱
export async function parseGameRecordExcel(file: File, players: Player[]): Promise<ParsedExcelResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const matchedPlayerIdsSet = new Set<string>();
  const battingData: Record<string, BattingStats> = {};
  const pitchingData: Record<string, PitchingStats> = {};
  const unmatchedRows: string[] = [];
  let totalRowsCount = 0;

  // 선수 찾기 헬퍼 (등번호 또는 이름)
  const findPlayer = (nameOrNum: any, nameAlt?: any): Player | undefined => {
    if (nameOrNum === undefined || nameOrNum === null || nameOrNum === '') return undefined;
    const strVal = String(nameOrNum).trim();
    const numVal = parseInt(strVal, 10);

    // 1. 등번호 정확 매칭
    if (!isNaN(numVal)) {
      const pByNum = players.find(p => p.number === numVal);
      if (pByNum) return pByNum;
    }

    // 2. 이름 정확 매칭
    const pByName = players.find(p => p.name.trim() === strVal);
    if (pByName) return pByName;

    // 3. nameAlt 도 확인
    if (nameAlt) {
      const altStr = String(nameAlt).trim();
      const pByAlt = players.find(p => p.name.trim() === altStr);
      if (pByAlt) return pByAlt;
    }

    return undefined;
  };

  // 값 숫자 변환 헬퍼
  const getNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const n = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // 시트별 탐색
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (rows.length === 0) return;

    const isPitchingSheet = sheetName.includes('투구') || sheetName.toLowerCase().includes('pitch');

    rows.forEach(row => {
      // 키 이름들을 유연하게 검색
      const keys = Object.keys(row);
      const getVal = (...possibleKeys: string[]) => {
        for (const pk of possibleKeys) {
          const matchedKey = keys.find(k => k.trim().toLowerCase().includes(pk.toLowerCase()));
          if (matchedKey && row[matchedKey] !== '') {
            return row[matchedKey];
          }
        }
        return undefined;
      };

      const numberVal = getVal('등번호', '번호', 'number', 'no');
      const nameVal = getVal('이름', '선수명', '선수', 'name');

      const targetPlayer = findPlayer(numberVal, nameVal) || findPlayer(nameVal);

      if (!targetPlayer) {
        if (nameVal || numberVal) {
          unmatchedRows.push(`[${sheetName}] 등번호:${numberVal || '-'}, 이름:${nameVal || '-'}`);
        }
        return;
      }

      totalRowsCount++;
      const pid = targetPlayer.id;

      if (isPitchingSheet) {
        // 투구 데이터 추출
        const ip = getNum(getVal('투구이닝', '이닝', 'ip'));
        const er = getNum(getVal('자책점', '자책', 'er'));
        const r = getNum(getVal('실점', 'r'));
        const h = getNum(getVal('피안타', '안타', 'h'));
        const bb = getNum(getVal('사사구', '볼넷', 'bb'));
        const so = getNum(getVal('탈삼진', '삼진', 'so', 'k'));
        const w = getNum(getVal('승리', '승', 'w'));
        const l = getNum(getVal('패전', '패', 'l'));
        const sv = getNum(getVal('세이브', 'sv'));

        if (ip > 0 || er > 0 || r > 0 || h > 0 || bb > 0 || so > 0 || w > 0 || l > 0 || sv > 0) {
          matchedPlayerIdsSet.add(pid);
          pitchingData[pid] = {
            playerId: pid,
            IP: ip,
            ER: er,
            R: r,
            H: h,
            BB: bb,
            SO: so,
            W: w,
            L: l,
            SV: sv,
          };
        }
      } else {
        // 타격 데이터 추출
        const pa = getNum(getVal('타석', 'pa'));
        const ab = getNum(getVal('타수', 'ab'));
        const h = getNum(getVal('안타', 'h'));
        const b2 = getNum(getVal('2루타', '2b'));
        const b3 = getNum(getVal('3루타', '3b'));
        const hr = getNum(getVal('홈런', 'hr'));
        const rbi = getNum(getVal('타점', 'rbi'));
        const r = getNum(getVal('득점', 'r'));
        const bb = getNum(getVal('볼넷', '사구', 'bb'));
        const so = getNum(getVal('삼진', 'so', 'k'));
        const sb = getNum(getVal('도루', 'sb'));

        if (pa > 0 || ab > 0 || h > 0 || rbi > 0 || r > 0 || bb > 0 || so > 0 || sb > 0) {
          matchedPlayerIdsSet.add(pid);
          battingData[pid] = {
            playerId: pid,
            PA: pa,
            AB: ab,
            H: h,
            '2B': b2,
            '3B': b3,
            HR: hr,
            RBI: rbi,
            R: r,
            BB: bb,
            SO: so,
            SB: sb,
          };
        }
      }
    });
  });

  return {
    matchedPlayerIds: Array.from(matchedPlayerIdsSet),
    battingData,
    pitchingData,
    unmatchedRows,
    totalRowsCount,
  };
}
