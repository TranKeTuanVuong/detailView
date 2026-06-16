import { message } from 'antd';

/**
 * 🌟 ĐỘNG CƠ BẪY URL DỰ PHÒNG TOÀN CỤC
 * Tự động nhận diện bối cảnh môi trường:
 * - Nếu chạy trên cổng Dev Vite (5173): Trỏ endpoint về thư mục chứa XAMPP local.
 * - Nếu chạy nhúng trực tiếp trong SuiteCRM: Sử dụng đường dẫn tương đối để ăn khớp Cookie Session.
 */
const getApiUrl = (entryPoint: string): string => {
  const isViteDev = window.location.port === '5173';
  const baseUrl = isViteDev ? 'http://localhost/baotramb1' : '.';
  return `${baseUrl}/index.php?entryPoint=${entryPoint}`;
};

/**
 * Hàm phụ trợ kiểm tra dữ liệu trả về có bị dính lỗi HTML/XAMPP Redirect hay không
 */
const isHtmlResponse = (text: string): boolean => {
  const cleanText = text.trim();
  return cleanText.startsWith('<!DOCTYPE') || cleanText.startsWith('<html') || cleanText.startsWith('<br');
};

/**
 * Hàm bốc tách lỗi PHP thô từ HTML nếu có để hiển thị Alert cho User
 */
const parsePhpError = (htmlText: string, fallbackMessage: string): string => {
  const phpErrorMatch = htmlText.match(/<b>(Fatal error|Warning|Notice)<\/b>:(.*?)(in <b>|<br)/i);
  return phpErrorMatch ? `${phpErrorMatch[1]}: ${phpErrorMatch[2].trim()}` : fallbackMessage;
};

export const OrderActionsApi = {
  /**
   * Tác vụ 1: CẬP NHẬT TIẾN/LÙI TRẠNG THÁI CHUNG (Duyệt, Đang giao, Hoàn thành...)
   */
  capNhatTrangThaiDonHang: async (recordId: string, statusValue: string) => {
    if (!recordId || !statusValue) {
      message.error('Thiếu thông tin đơn hàng để cập nhật trạng thái.');
      return { success: false };
    }

    try {
      const params = new URLSearchParams();
      params.append('record', recordId);
      params.append('status', statusValue);

      const response = await fetch(getApiUrl('sgtOrdersUpdateStatus'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest' // Giả lập Ajax request chuẩn né chặn bảo mật
        },
        body: params.toString(), 
        credentials: 'include' 
      });

      const responseText = await response.text();

      if (isHtmlResponse(responseText)) {
        console.error('❌ [SERVER ERROR - UPDATE STATUS HTML]:\n', responseText);
        const errorHint = parsePhpError(responseText, 'Hệ thống trả về giao diện HTML (Vui lòng kiểm tra lại phiên đăng nhập).');
        message.error(`Lỗi hệ thống: ${errorHint}`);
        return { success: false };
      }

      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Lỗi parse JSON phản hồi trạng thái:', responseText);
        message.error('Phản hồi dữ liệu trạng thái từ máy chủ không hợp lệ.');
        return { success: false };
      }

      if (responseJson && responseJson.success) {
        return { success: true, data: responseJson };
      } else {
        message.error(responseJson?.message || 'Cập nhật trạng thái thất bại.');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Lỗi kết nối cập nhật trạng thái:', error);
      message.error('Không thể kết nối tới máy chủ để cập nhật trạng thái.');
      return { success: false };
    }
  },

  /**
   * Tác vụ 2: CẬP NHẬT TRẠNG THÁI ĐÓNG GÓI ĐƠN HÀNG (Xác nhận gói / Hủy đóng gói)
   */
  capNhatTrangThaiDongGoiDonHang: async (recordId: string, statusValue: string) => {
    if (!recordId || !statusValue) {
      message.error('Thiếu thông tin đơn hàng để cập nhật trạng thái đóng gói.');
      return { success: false };
    }

    try {
      const params = new URLSearchParams();
      params.append('record', recordId);
      params.append('status', statusValue);

      const response = await fetch(getApiUrl('sgtOrdersUpdateFinalStatus'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: params.toString(),
        credentials: 'include'
      });

      const responseText = await response.text();

      if (isHtmlResponse(responseText)) {
        console.error('❌ [SERVER ERROR - DONG GOI HTML]:\n', responseText);
        const errorHint = parsePhpError(responseText, 'Hệ thống trả về giao diện HTML thay vì JSON dữ liệu.');
        message.error(`Lỗi đóng gói: ${errorHint}`);
        return { success: false };
      }

      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Lỗi parse JSON phản hồi đóng gói:', responseText);
        message.error('Phản hồi từ máy chủ đóng gói không hợp lệ.');
        return { success: false };
      }

      if (responseJson && responseJson.success) {
        return { success: true, data: responseJson };
      } else {
        message.error(responseJson?.message || 'Cập nhật trạng thái đóng gói thất bại.');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Lỗi kết nối cập nhật đóng gói đơn hàng:', error);
      message.error('Không thể kết nối tới máy chủ cập nhật đóng gói.');
      return { success: false };
    }
  },

  /**
   * Tác vụ 3: Lấy danh sách đơn vị vận chuyển (Nhà xe, shipper)
   */
  getShippingUnits: async () => {
    try {
      const response = await fetch(getApiUrl('sgtOrdersGetShippingUnits'), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });
      const responseText = await response.text();
      
      if (isHtmlResponse(responseText)) {
        console.error('❌ [SERVER ERROR - GET SHIPPING UNITS HTML]:\n', responseText);
        return { success: false, units: [] };
      }
      
      const responseJson = JSON.parse(responseText);
      return { success: true, units: responseJson?.units || [] };
    } catch (error) {
      console.error('❌ Lỗi tải đơn vị vận chuyển:', error);
      return { success: false, units: [] };
    }
  },

  /**
   * Tác vụ 4: Gửi dữ liệu xuất kho kèm thông tin shipper lên server
   */
  submitXuatKho: async (payload: {
    recordId: string;
    shippingUnitId: string;
    shipperName: string;
    shipperPhone: string;
    shipperNotes: string;
  }) => {
    try {
      const params = new URLSearchParams();
      params.append('record', payload.recordId);
      params.append('status', 'danggiao'); // Ép cứng trạng thái Đang giao theo luồng PHP gốc
      params.append('shippingUnitId', payload.shippingUnitId);
      params.append('shipperName', payload.shipperName);
      params.append('shipperPhone', payload.shipperPhone);
      params.append('shipperNotes', payload.shipperNotes);

      const response = await fetch(getApiUrl('sgtOrdersUpdateStatus'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: params.toString(),
        credentials: 'include'
      });

      const responseText = await response.text();

      // 🌟 KHỐI CẬP NHẬT: Thêm bẫy phòng vệ chống sập màn hình khi Server trả về HTML/Lỗi XAMPP
      if (isHtmlResponse(responseText)) {
        console.error('❌ [SERVER ERROR - XUAT KHO HTML]:\n', responseText);
        const errorHint = parsePhpError(responseText, 'Hệ thống trả về mã HTML lỗi cấu hình hoặc mất phiên đăng nhập.');
        message.error(`Lỗi thực thi xuất kho: ${errorHint}`);
        return { success: false, message: errorHint };
      }

      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Lỗi parse JSON phản hồi xuất kho:', responseText);
        message.error('Phản hồi kết quả xuất kho từ máy chủ không hợp lệ.');
        return { success: false, message: 'Dữ liệu phản hồi bị lỗi.' };
      }

      return responseJson;
    } catch (error) {
      console.error('❌ Lỗi thực thi xuất kho:', error);
      return { success: false, message: 'Mất kết nối máy chủ xuất kho.' };
    }
  }
};