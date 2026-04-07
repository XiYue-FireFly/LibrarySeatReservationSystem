import { Lab, Reservation } from './types';

export const MOCK_LABS: Lab[] = [
  {
    id: '1',
    name: '实验楼 A 402',
    responsible: '张三',
    phone: '138-xxxx-xxxx',
    status: 'available',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADdBVQB0wI_GA9lx6sCPeR-uBdgThkLH6PXW6dBS5NBnZCOW8e2ZOE3FAKGJ-te36CejCTbYlQfzCSEnmiY-BA6M9g0nQHpzEiMPdbC2J1EB1rie0qGyw4j1BZJAL1aRuxKLA2vSi0FNmBTRdKaizj_9Q9v9N5i00gdC94OecTcb34xqsV0heYomtruLfxs2K94YJRJoKvWGpNlCDCKfTuw_-mAJkprkfmJ5TWK_hEAgDQFtftnwCDldyhom3eusJBIKFzlLi_9C8',
  },
  {
    id: '2',
    name: '实验楼 B 215',
    responsible: '李四',
    phone: '139-xxxx-xxxx',
    status: 'reserved',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAzx_9Tq0Q8TKNfB8QN7QPCVFUcqYsDNozP4_JGB-K6S1yAB2VJT1AKdUrVM5f45af8_CUSI7jofJ6AccN-ENQWiqwMbzY0gLfEIKZ0lKDc8aztKIgqLdoLPbyq6AXOuZ_yPy7lvkKLT2w13AgNI23k9ilYmPFLYwqBDOgQ-HFPIZQkOIqMu7YzYgtr5C-6z-G3MBnjv6MZmzRWP2aeKXFTvYC034Vlf5GwnLyLJAnUeSxlfiT98c5hoRc5wcunqDxp93fJeuJ_KQ',
  },
  {
    id: '3',
    name: '创新中心 C 101',
    responsible: '王五',
    phone: '137-xxxx-xxxx',
    status: 'available',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKAjjlcKi-K25kUwjAcUrTqtnku9r0nW8RucSeBMDkLxt29xZcZwqSXHKpFCW_IgVR_ugvxY0RvRRYqt49y-CWvshTA8JoDUWP7GrBrwNZ7f27MuMYYcyM4RVukxpNYOOHrkZjHNarK7yqz6P3_yq6iu_mdOPtzjdnHVYwuGi1n_MLjLh4VP1_kkTdP-J7G88ZoElY-Mdos1LUxw_9TsHbdUwh_XQhQ_SfRncup4LrZqRHk7F6uF-jglwupb3KcNxard0MVAb4kL0',
  },
  {
    id: '4',
    name: '信息大楼 D 504',
    responsible: '赵六',
    phone: '135-xxxx-xxxx',
    status: 'available',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5zfzqdpu0nYH9xa59uH-ESBiR59urqfhAlgNJcvAwsnYKSWQrSB40qnDCeAiWlrezd9pfjYpQePrEIWvMFSmeJNHqg2rdTxAxmj-vicRk5la5hBXxM5slQp2gD9aA6lOrrHbDWqavStvvW5QudI2diBgc4ChLBvmDqWtqUYcsQCOfBLAO6YKmtHmdZSYUvM6C90QrxaL0ANSUVquhxMrt4qscCZDW3cgioW7Y1Gg8YyjPZAyYudN0MxI_K-MphXstOqPGvhOZJeI',
  },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    labName: '高精精密物理实验室',
    seatNumber: 'A-042',
    date: '2023.10.24',
    timeSlot: '14:00 - 17:00',
    status: 'ongoing',
  },
  {
    id: 'r2',
    labName: '人工智能创新中心 3F',
    seatNumber: 'C-108',
    date: '2023.10.26',
    timeSlot: '09:00 - 12:00',
    status: 'ongoing',
  },
  {
    id: 'r3',
    labName: '化学基础实验室',
    seatNumber: 'B-201',
    date: '2023.09.15',
    timeSlot: '10:00 - 12:00',
    status: 'expired',
  },
  {
    id: 'r4',
    labName: '生物工程中心',
    seatNumber: 'E-115',
    date: '2023.08.20',
    timeSlot: '13:00 - 15:00',
    status: 'expired',
  },
];
