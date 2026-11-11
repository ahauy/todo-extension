/**
 * Châm ngôn học tập — mỗi ngày một câu, chọn theo ngày trong năm nên ổn định
 * suốt cả ngày và đổi sang câu khác vào hôm sau. Chỉ dùng tục ngữ, ca dao và
 * trích dẫn có nguồn thật; câu diễn ý được ghi rõ là diễn ý.
 */

export interface Maxim {
  quote: string;
  source: string;
}

export const MAXIMS: Maxim[] = [
  { quote: 'Có công mài sắt, có ngày nên kim.', source: 'Tục ngữ Việt Nam' },
  { quote: 'Học đi đôi với hành.', source: 'Tục ngữ Việt Nam' },
  { quote: 'Dốt đến đâu, học lâu cũng biết.', source: 'Tục ngữ Việt Nam' },
  { quote: 'Văn ôn võ luyện.', source: 'Tục ngữ Việt Nam' },
  { quote: 'Đi một ngày đàng, học một sàng khôn.', source: 'Tục ngữ Việt Nam' },
  { quote: 'Học thầy không tày học bạn.', source: 'Tục ngữ Việt Nam' },
  { quote: 'Không thầy đố mày làm nên.', source: 'Tục ngữ Việt Nam' },
  {
    quote: 'Muốn sang thì bắc cầu kiều, muốn con hay chữ phải yêu lấy thầy.',
    source: 'Ca dao Việt Nam',
  },
  {
    quote: 'Ngọc bất trác, bất thành khí; nhân bất học, bất tri lý.',
    source: 'Tam Tự Kinh',
  },
  {
    quote: 'Học không biết chán, dạy không biết mỏi.',
    source: 'Luận Ngữ · Thuật nhi',
  },
  {
    quote: 'Học rồi mới biết cái chưa hay của mình.',
    source: 'Lễ Ký · Học ký (diễn ý)',
  },
  { quote: 'Học, học nữa, học mãi.', source: 'V. I. Lenin' },
  {
    quote:
      'Non sông Việt Nam có trở nên tươi đẹp hay không… phần lớn nhờ ở công học tập của các em.',
    source: 'Hồ Chí Minh · Thư gửi học sinh, 9/1945',
  },
  { quote: 'Một kho vàng không bằng một nang chữ.', source: 'Tục ngữ Việt Nam' },
];

/** Số ngày kể từ đầu năm — cùng một ngày luôn cho cùng một câu */
export function maximFor(date: Date): Maxim {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return MAXIMS[dayOfYear % MAXIMS.length];
}