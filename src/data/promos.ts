import { PromoCode } from '../types';

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'TASTY50',
    description: '新客首購滿 $300 現折 $50',
    discountType: 'amount',
    discountValue: 50,
    minSpend: 300,
  },
  {
    code: 'WELCOME10',
    description: '全館消費滿 $200 享 9 折優惠',
    discountType: 'percentage',
    discountValue: 10, // 10% off
    minSpend: 200,
  },
  {
    code: 'FREESHIP',
    description: '外送滿 $400 免運費',
    discountType: 'free_shipping',
    discountValue: 40, // cancels $40 delivery fee
    minSpend: 400,
  },
];
