// 1. Định nghĩa cấu trúc cho các Option của trường kiểu 'enum'
export interface FieldOption {
  value: string;
  label: string;
}

// 2. Định nghĩa chi tiết các thuộc tính cho từng Field trong cấu hình
export interface ListViewField {
  name: string;
  label: string;
  // Giới hạn các kiểu dữ liệu thực tế thu được từ SuiteCRM JSON của bạn
  type: 'name' | 'date' | 'relate' | 'bool' | 'enum' | 'currency' | 'text' | 'datetime' | 'datetimecombo' | 'decimal' | 'float' | 'int';
  options?: FieldOption[]; // Dấu ? nghĩa là có thể có hoặc không (enum mới có)
  
  // Bạn có thể mở rộng thêm các thuộc tính ẩn nếu API SuiteCRM trả về sau này
  label_key?: string;
  width?: string;
  default?: boolean;
  link?: boolean;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center' | '';
  custom_code?: string;
  related_module?: string;
}

// 3. Định nghĩa cấu trúc tổng thể cho toàn bộ Object Layout cấu hình
export interface ListViewLayoutConfig {
  success: boolean;
  module: string;
  fields: ListViewField[];
}