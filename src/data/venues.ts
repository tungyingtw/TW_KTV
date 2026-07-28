export interface VenueBranch {
  id: string;
  brandId: string;
  name: string;
  city: string;
  karaokeSystem: string;
  description: string;
}

export const VENUE_BRANCHES: VenueBranch[] = [
  { id: 'all', brandId: 'all', name: '全台所有門市分店', city: '全台灣', karaokeSystem: '通用相容系統', description: '顯示全台各大廠牌所有發行歌號' },
  { id: 'wh_kh_arena', brandId: 'watering_hole', name: '享○馨 高雄巨蛋店', city: '高雄市', karaokeSystem: '享○馨雙螢幕 VOD 系統', description: '享○馨旗艦包廂，原版 MV 與高清影音' },
  { id: 'wh_tn_chimei', brandId: 'watering_hole', name: '享○馨 台南奇美店', city: '台南市', karaokeSystem: '享○馨庭園 VOD 系統', description: '台南庭園連鎖門市' },
  { id: 'wh_pt_pingtung', brandId: 'watering_hole', name: '享○馨 屏東自由店', city: '屏東縣', karaokeSystem: '享○馨庭園 VOD 系統', description: '屏東旗艦連鎖門市' },
  { id: 'cb_tp_jianguo', brandId: 'cashbox', name: '錢○ 台北建國店', city: '台北市', karaokeSystem: '錢○ Cashbox HD-VOD', description: '台北旗艦門市，全台原版 MV 最高' },
  { id: 'cb_ty_taoyuan', brandId: 'cashbox', name: '錢○ 桃園中華店', city: '桃園市', karaokeSystem: '錢○ Cashbox HD-VOD', description: '桃園站前旗艦連鎖' },
  { id: 'cb_tc_zizhong', brandId: 'cashbox', name: '錢○ 台中自由店', city: '台中市', karaokeSystem: '錢○ Cashbox HD-VOD', description: '台中中區連鎖門市' },
  { id: 'hd_tp_ximending', brandId: 'holiday', name: '好○迪 台北西門店', city: '台北市', karaokeSystem: '好○迪 K-VOD 系統', description: '西門町熱門連鎖門市' },
  { id: 'hd_tc_sanmin', brandId: 'holiday', name: '好○迪 台中三民店', city: '台中市', karaokeSystem: '好○迪 K-VOD 系統', description: '台中一中商圈熱門門市' },
  { id: 'sl_tp_fuxing', brandId: 'starlight', name: '星○點 台北復興店', city: '台北市', karaokeSystem: '星○點自助系統', description: '台北東區時尚自助餐' },
  { id: 'sl_nt_banqiao', brandId: 'starlight', name: '星○點 板橋中山店', city: '新北市', karaokeSystem: '星○點自助系統', description: '新北板橋旗艦門市' }
];

export interface PitchGuide {
  originalKey: string;
  maleToFemaleKey: string;
  femaleToMaleKey: string;
}

export function getPitchGuide(artistGender: 'M' | 'F' | 'Group'): PitchGuide {
  if (artistGender === 'M') {
    return {
      originalKey: '男聲原調 (E小調 / G大調)',
      maleToFemaleKey: '女聲翻唱：升 +3 ~ +4 鍵',
      femaleToMaleKey: '男聲原調唱即可',
    };
  } else if (artistGender === 'F') {
    return {
      originalKey: '女聲原調 (A小調 / C大調)',
      maleToFemaleKey: '女聲原調唱即可',
      femaleToMaleKey: '男聲翻唱：降 -2 ~ -3 鍵',
    };
  } else {
    return {
      originalKey: '男女對唱 / 樂團調性',
      maleToFemaleKey: '建議合唱或升 +2 鍵',
      femaleToMaleKey: '建議合唱或降 -2 鍵',
    };
  }
}
