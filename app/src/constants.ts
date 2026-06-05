import { Lab, Reservation } from './types';

export const MOCK_LABS: Lab[] = [
  {
    id: '1',
    name: '实验楼 A 402',
    managerName: '张三',
    status: 'available',
    totalSeats: 40,
  },
  {
    id: '2',
    name: '实验楼 B 215',
    managerName: '李四',
    status: 'unavailable',
    totalSeats: 30,
  },
  {
    id: '3',
    name: '创新中心 C 101',
    managerName: '王五',
    status: 'available',
    totalSeats: 50,
  },
  {
    id: '4',
    name: '信息大楼 D 504',
    managerName: '赵六',
    status: 'available',
    totalSeats: 20,
  },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    labName: '高精精密物理实验室',
    seatNo: 'A-042',
    bookStartTime: '2023.10.24 14:00',
    bookEndTime: '2023.10.24 17:00',
    status: 'CHECKED_IN',
  },
  {
    id: 'r2',
    labName: '人工智能创新中心 3F',
    seatNo: 'C-108',
    bookStartTime: '2023.10.26 09:00',
    bookEndTime: '2023.10.26 12:00',
    status: 'CHECKED_IN',
  },
  {
    id: 'r3',
    labName: '化学基础实验室',
    seatNo: 'B-201',
    bookStartTime: '2023.09.15 10:00',
    bookEndTime: '2023.09.15 12:00',
    status: 'FINISHED',
  },
  {
    id: 'r4',
    labName: '生物工程中心',
    seatNo: 'E-115',
    bookStartTime: '2023.08.20 13:00',
    bookEndTime: '2023.08.20 15:00',
    status: 'FINISHED',
  },
];
