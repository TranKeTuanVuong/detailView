import React, { useState, useEffect ,useMemo} from 'react';
// 🟢 SỬA THÀNH ĐOẠN NÀY (Thêm Form, Input, Select vào cuối):
import { Row, Col, Typography, Checkbox, Button, Spin, message, Modal, Form, Input, Select } from 'antd';
import { OrderActionsApi } from '../services/api/OrderActionsApi';
import dayjs from 'dayjs';

import { DetailApi } from '../services/useApi/DetaialApi';

// Import các Subcomponents tháp cấu trúc UI vệ tinh bản Read-only chi tiết
import FormPanels from '../components/DetailView/FormPanels';
import FormTabs from '../components/DetailView/FormTabs';
import LineItemsSection from '../components/DetailView/LineItemsSection';
import UniversalLineItemSection from '../components/DetailView/UniversalLineItemSection';
import PricePolicySection from '../components/DetailView/PricePolicySection';

// Import CSS
import './css/EditView.css';

const { Title, Text } = Typography;

/* ================= LABEL CLEAN ================= */
const cleanSystemLabel = (label) => {
  if (!label) return '';
  const upperLabel = label.trim().toUpperCase();
  if (upperLabel === 'LBL_ORDER_INFORMATION' || upperLabel === 'DEFAULT') return 'Thông tin đơn hàng';
  if (upperLabel === 'LBL_DETAILVIEW_PANEL1' || upperLabel === 'LBL_EDITVIEW_PANEL2') return 'Thông tin khách hàng';
  if (upperLabel === 'LBL_ORDER_LINE_ITEMS' || upperLabel === 'LBL_EDITVIEW_PANEL1') return 'Danh sách sản phẩm';

  if (/^lbl_/i.test(label)) {
    return label
      .replace(/^LBL_/i, '')
      .replace(/^lbl_/i, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return label;
};

/* ================= BỘ ĐIỀU HƯỚNG TRƯỜNG DETAIL CUSTOM (DATE ENTERED / MODIFIED) ================= */
const CustomRenderDetailRouter = ({ field, formData, RenderField }) => {
  switch (field.custom_render_type) {
    case 'system_tracking_logs': {
      const isCreated = field.name === 'date_entered';
      const dateVal = formData[field.name] ? dayjs(formData[field.name]).format('DD/MM/YYYY HH:mm') : '---';
      const userVal = isCreated ? formData['created_by_name'] : formData['modified_by_name'];
      return (
        <div style={{ padding: '4px 0' }}>
          <Text style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>
            {dateVal} <span style={{ color: '#94a3b8', fontWeight: 400 }}>bởi</span> {userVal || 'Hệ thống'}
          </Text>
        </div>
      );
    }
    default:
      return <RenderField field={field} value={formData[field.name]} />;
  }
};

/* ================= COMPONENT BIẾN Ô NHẬP THÀNH TEXT THUẦN (DETAIL VIEW MODE) ================= */
const RenderFieldDetail = ({ field, value }) => {
  const labelText = cleanSystemLabel(field.label);
  const displayValue = (value !== undefined && value !== null && value !== '') ? value : '---';
  const fieldName = String(field.name || '').toLowerCase();

  if (fieldName.includes('image') || fieldName.includes('product_image')) {
    return value && String(value).trim() !== '' && String(value) !== '---' ? (
      <div style={{ marginTop: '4px' }}>
        <img 
          src={String(value)} 
          alt={labelText || "Hình ảnh sản phẩm"} 
          style={{ 
            maxWidth: '120px', 
            maxHeight: '120px', 
            objectFit: 'cover', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
          }} 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'https://placehold.co/120x120?text=No+Image'; 
          }}
        />
      </div>
    ) : (
      <Text style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật ảnh 🖼️</Text>
    );
  }

  switch (field.type) {
    case 'varchar':
    case 'name':
    case 'phone':
    case 'iframe':
    case 'text':
    case 'address':
    case 'html':
      return <Text style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>{String(displayValue)}</Text>;
    
    case 'relate':
    case 'flex_relate':
      return (
        <Text style={{ fontSize: '13px', fontWeight: 600, color: '#0088FF' }}>
          {typeof value === 'object' ? (value?.name || '---') : String(displayValue)}
        </Text>
      );
    
    case 'enum': {
      const matchedOption = (field.options || []).find(opt => String(opt.value) === String(value));
      return <Text style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>{matchedOption ? matchedOption.label : String(displayValue)}</Text>;
    }
    
    case 'date':
      return <Text style={{ fontSize: '13px', color: '#475569' }}>{value ? dayjs(value).format('DD/MM/YYYY') : '---'}</Text>;
    
    case 'datetime':
    case 'datetimecombo':
      return <Text style={{ fontSize: '13px', color: '#475569' }}>{value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '---'}</Text>;
    
    case 'currency':
      return <Text style={{ fontSize: '14px', fontWeight: 600, color: '#ff4d4f' }}>{value ? `${Number(value).toLocaleString()} đ` : '0 đ'}</Text>;
    
    case 'decimal':
    case 'float':
    case 'int':
      return <Text style={{ fontSize: '13px', fontWeight: 500 }}>{value ? Number(value).toLocaleString() : '0'}</Text>;
    
    case 'bool':
      return (
        <Checkbox disabled checked={value === 1 || value === true || value === '1' || value === 'true'}>
          {labelText}
        </Checkbox>
      );
    
    default:
      return <Text style={{ fontSize: '13px' }}>{String(displayValue)}</Text>;
  }
};

/* ================= COMPONENT CHÍNH DETAILVIEW ================= */
export default function DetailView() {
 const {
    urls,
    layout,
    loading,
    module,
    setModule,
    setRecordId,     // Lấy ra từ hook
    setAction,       // Lấy ra từ hook
    setCheckAction,  // Lấy ra từ hook
    handleLayOut
  } = DetailApi();

  const urlParams = useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  const currentModule = urlParams.get('module') || 'sgt_orders'; 
  const recordId = urlParams.get('record') || '14c3c565-879f-c95a-8886-69e617e6cddf';
  const currentAction = urlParams.get('action') || 'DetailView';
  const checkActionParam = urlParams.get('check_action');

  useEffect(() => {
    if (currentModule) {
      setModule(currentModule);
      setRecordId(recordId);
      setAction(currentAction);
      setCheckAction(checkActionParam);
      
      // Kích hoạt nạp layout và bốc data theo cặp tham số bối cảnh mới
      handleLayOut(currentModule, 'edit'); 
      get_universal_module_data(currentModule, recordId);
    }
  }, [recordId, currentModule, currentAction, checkActionParam]);
  const [formData, setFormData] = useState({});
  const [panelsData, setPanelsData] = useState({});
  const [warehouseId, setWarehouseId] = useState(null);

  const [currentUserRoles, setCurrentUserRoles] = useState(['NVKD', 'NVKHO']);

  const lineItems = panelsData['sgt_orderdetail'] || [];


  // Quản lý ẩn hiện Modal xuất kho và dữ liệu nhà xe
  const [isXuatKhoModalOpen, setIsXuatKhoModalOpen] = useState(false);
  const [shippingUnits, setShippingUnits] = useState([]);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [xuatKhoForm] = Form.useForm(); // Hook quản lý form của Ant Design
 
  
  

  useEffect(() => {
    if (recordId && module) {
      handleLayOut(module, 'edit'); 
    }
  }, [recordId, module]);

  const get_universal_module_data = async (targetModule, targetRecordId) => {
    if (!targetModule || !targetRecordId || !layout) return;

    try {
      const payload = {
        module: targetModule,
        record_id: targetRecordId,
        type: 'edit' 
      };

      const response = await fetch('./index.php?entryPoint=get_universal_module_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (resData && resData.success) {
        console.log('✅ [DỮ LIỆU ĐỐI XỨNG PHẲNG-CÂY ĐÃ ĐỒNG BỘ]:', resData);
        setFormData(resData.parent_fields || {});

        const cleanedPanelsData = {};
        if (resData.line_items_data) {
          Object.keys(resData.line_items_data).forEach((moduleKey) => {
            const rawRows = resData.line_items_data[moduleKey] || [];
            const isDiscountQtyModule = moduleKey === 'sgt_discount_qty' || rawRows.some(
              row => (row.qty_from !== undefined || row.from_qty !== undefined)
            );

            if (isDiscountQtyModule) {
              const groupedMap = {};
              rawRows.forEach((row) => {
                const groupKey = row.aos_products_id_c || row.aos_product_categories_id_c || row.sgt_brands_id_c || 'default_group';

                if (!groupedMap[groupKey]) {
                  groupedMap[groupKey] = {
                    ...row,
                    id: groupKey, 
                    tiers: [] 
                  };
                }

                groupedMap[groupKey].tiers.push({
                  id: row.id,
                  from_qty: row.qty_from || row.from_qty || 0,
                  to_qty: row.qty_to || row.to_qty || 0,
                  discount: row.discount || 0,
                  discount_type: row.discount_type || 'percent'
                });
              });

              cleanedPanelsData[moduleKey] = Object.values(groupedMap);

            } else {
              cleanedPanelsData[moduleKey] = rawRows.map((row, idx) => ({
                ...row,
                id: row.id || `row_detail_${idx}`,
                qty_c: row.qty_c !== undefined ? row.qty_c : (row.qty || 1),
                price_c: row.price_c !== undefined ? row.price_c : (row.price || 0),
                discount_sp_c: row.discount_sp_c !== undefined ? row.discount_sp_c : (row.discount || 0),
                discount_type_sp_c: row.discount_type_sp_c || row.discount_type || 'direct',
                subtotal_c: row.subtotal_c !== undefined ? row.subtotal_c : (row.subtotal || 0)
              }));
            }
          });
        }
        
        setPanelsData(cleanedPanelsData);
        
        const foundWarehouseKey = Object.keys(resData.parent_fields || {}).find(
          k => k.includes('warehouse_id') || k.includes('warehouse_src')
        );
        if (foundWarehouseKey && resData.parent_fields[foundWarehouseKey]) {
          const val = resData.parent_fields[foundWarehouseKey];
          setWarehouseId(typeof val === 'object' ? val.id : val);
        }

      } else {
        message.error(resData?.message || 'Không thể trích xuất dữ liệu chi tiết từ máy chủ');
      }
    } catch (error) {
      console.error('❌ Lỗi định tuyến hệ thống:', error);
      message.error('Hệ thống mất kết nối với PHP API bốc dữ liệu!');
    }
  };

  useEffect(() => {
    if (recordId && layout?.module) {
      get_universal_module_data(layout.module, recordId);
    }
  }, [recordId, layout]);

  const handleFormChange = () => {};

  // Hàm nạp danh sách nhà xe khi mở modal
  const handleOpenXuatKho = async () => {
    if ((formData?.status || '').toLowerCase() !== 'dadonggoi') {
      message.warning('Chỉ xuất kho khi đơn hàng đang ở trạng thái đã đóng gói.');
      return;
    }
    setIsXuatKhoModalOpen(true);
    const res = await OrderActionsApi.getShippingUnits();
    if (res.success) {
      setShippingUnits(res.units);
    }
  };

  // Hàm xử lý Auto-fill dữ liệu khi người dùng chọn Đơn vị vận chuyển
  const handleSelectShippingUnit = (value, option) => {
    const unit = option.unitdata;
    xuatKhoForm.setFieldsValue({
      shippingUnitId: unit.id,
      shipperName: unit.name,
      shipperPhone: unit.type !== 'marketplace' ? (unit.phone || '') : '',
      shipperNotes: unit.description || ''
    });
  };

  // Hàm nhấn nút Tiếp tục - Submit dữ liệu lên PHP
  const handleSubmitXuatKho = async (values) => {
    setIsSubmitLoading(true);
    const res = await OrderActionsApi.submitXuatKho({
      recordId,
      shippingUnitId: values.shippingUnitId || '',
      shipperName: values.shipperName || '',
      shipperPhone: values.shipperPhone || '',
      shipperNotes: values.shipperNotes || '',
    });
    setIsSubmitLoading(false);

    if (res && res.success) {
      message.success('Xuất kho đơn hàng thành công! 🚚');
      setIsXuatKhoModalOpen(false);
      xuatKhoForm.resetFields();
      setFormData(prev => ({ ...prev, status: 'danggiao' })); // Cập nhật mượt trạng thái UI
    } else {
      message.error(res?.message || 'Cập nhật trạng thái xuất kho thất bại.');
    }
  };

  /**
   * ====================================================================
   * 🛠️ ĐỘNG CƠ CẬP NHẬT TRẠNG THÁI TIẾN/LÙI CHUNG (Duyệt/Giao hàng/Thu tiền)
   * ====================================================================
   */
  const handleUpdateStatus = (targetStatus, confirmMessage, successMessage) => {
    Modal.confirm({
      title: 'Xác nhận thay đổi trạng thái',
      content: confirmMessage,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        const res = await OrderActionsApi.capNhatTrangThaiDonHang(recordId, targetStatus);
        if (res.success) {
          message.success(successMessage);
          setFormData(prev => ({ ...prev, status: targetStatus }));
        }
      }
    });
  };

  /**
   * ====================================================================
   * 🛠️ ĐỘNG CƠ CẬP NHẬT TRẠNG THÁI ĐÓNG GÓI RIÊNG BIỆT (Xác nhận/Hủy đóng gói)
   * ====================================================================
   */
  const handleUpdatePackingStatus = (targetStatus, confirmMessage, successMessage) => {
    Modal.confirm({
      title: 'Xác nhận trạng thái đóng gói',
      content: confirmMessage,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        const res = await OrderActionsApi.capNhatTrangThaiDongGoiDonHang(recordId, targetStatus);
        if (res.success) {
          message.success(successMessage);
          setFormData(prev => ({ ...prev, status: targetStatus }));
        }
      }
    });
  };
  /**
 * Hàm Helper tự động bẫy Domain bối cảnh môi trường (Dev vs Prod)
 */
const getBackendUrl = (pathWithEntryPoint) => {
  // Kiểm tra nếu đang chạy ở cổng phát triển của Vite (Port 5173)
  if (window.location.port === '5173') {
    return `http://localhost/baotramb1${pathWithEntryPoint}`;
  }
  // Nếu đã build và nhúng vào SuiteCRM, dùng đường dẫn tương đối gốc của Server
  return `./${pathWithEntryPoint}`;
};

  const renderOrderActionButtons = () => {
    const status = formData?.status || 'chuaduyet';
    const isNVKHO = currentUserRoles.includes('NVKHO');
    const isNVKD = currentUserRoles.includes('NVKD');

    const orderButtons = [
      {
        id: 'edit_button',
        label: 'Chỉnh sửa',
        show: true, 
        type: 'primary',
        onClick: () => {
          window.location.href = urls?.url_edit || `./index.php?module=${layout.module}&action=EditView&record=${recordId}`;
        }
      },
      {
        id: 'btn_duyet',
        label: 'Duyệt',
        show: isNVKHO && status === 'chuaduyet',
        type: 'primary',
        onClick: () => handleUpdateStatus('chodonggoi', 'Bạn có chắc chắn muốn DUYỆT đơn hàng này?', 'Duyệt đơn hàng thành công! 🎉')
      },
      {
        id: 'btn_huyduyet',
        label: 'Hủy duyệt',
        show: (isNVKD || isNVKHO) && status === 'chodonggoi',
        onClick: () => handleUpdateStatus('chuaduyet', 'Bạn có chắc chắn muốn HỦY DUYỆT đơn hàng này?', 'Hủy duyệt thành công.')
      },
      {
        // 📦 NÚT XÁC NHẬN ĐÓNG GÓI
        id: 'btn_confirm_packing',
        label: 'Xác nhận đóng gói',
        // Kiểm tra phân quyền (ví dụ Nhân viên kinh doanh hoặc Nhân viên kho)
        show: isNVKD || isNVKHO, 
        onClick: async () => {
          // 🛑 1. Bẫy chặn trạng thái chuẩn xác từ file JS gốc
          if ((formData?.status || '').toLowerCase() !== 'chodonggoi') {
            message.error('Chỉ xác nhận đóng gói khi đơn hàng đang chờ đóng gói.');
            return;
          }

          if (window.confirm('Bạn có chắc chắn muốn xác nhận đã đóng gói đơn hàng này?')) {
            // 🚀 2. Gọi API tác vụ 2 (sgtOrdersUpdateFinalStatus)
            const res = await OrderActionsApi.capNhatTrangThaiDongGoiDonHang(recordId, 'dadonggoi');
            if (res.success) {
              message.success('Xác nhận đóng gói đơn hàng thành công!');
              // Làm mới dữ liệu hoặc reload trang tùy kiến trúc dự án của bạn
              handleFetchData(); 
            }
          }
        }
      },
      {
        // ❌ NÚT HỦY ĐÓNG GÓI
        id: 'btn_cancel_packing',
        label: 'Hủy đóng gói',
        show: isNVKD || isNVKHO,
        onClick: async () => {
          const currentStatus = (formData?.status || '').toLowerCase();

          // 🛑 1. Bẫy chặn các điều kiện lỗi từ file JS gốc
          if (currentStatus === 'chuaduyet') {
            message.error('Không thể hủy đóng gói khi đơn hàng chưa duyệt.');
            return;
          }
          if (currentStatus === 'chodonggoi') {
            message.error('Đơn hàng này đã ở trạng thái chưa đóng gói rồi.');
            return;
          }

          if (window.confirm('Bạn có chắc chắn muốn HỦY đóng gói đơn hàng này?')) {
            // 🚀 2. Gọi API với tham số quay về 'chodonggoi'
            const res = await OrderActionsApi.capNhatTrangThaiDongGoiDonHang(recordId, 'chodonggoi');
            if (res.success) {
              message.success('Hủy đóng gói đơn hàng thành công!');
              handleFetchData();
            }
          }
        }
      },
      {
        id: 'btn_xuatkho',
        label: 'Xuất kho',
        show: (isNVKD || isNVKHO) && status === 'dadonggoi',
        type: 'primary',
        onClick: handleOpenXuatKho // 🔥 Gọi hàm kích hoạt mở Form Modal Ant Design ở trên
      },
      {
        id: 'btn_back_dadonggoi',
        label: 'Lùi về Đã đóng gói',
        show: (isNVKD || isNVKHO) && status === 'danggiao',
        onClick: () => handleUpdateStatus('dadonggoi', 'Lùi trạng thái đơn hàng về Đã đóng gói?', 'Đã trả về trạng thái Đã đóng gói.')
      },
      {
        id: 'btn_dagiao',
        label: 'Đã giao',
        show: (isNVKD || isNVKHO) && status === 'danggiao',
        type: 'primary',
        onClick: () => handleUpdateStatus('dagiao', 'Xác nhận khách hàng đã nhận được hàng?', 'Đã chuyển sang Đã giao.')
      },
      {
        id: 'btn_back_danggiao',
        label: 'Lùi về Đang giao',
        show: (isNVKD || isNVKHO) && status === 'dagiao',
        onClick: () => handleUpdateStatus('danggiao', 'Lùi trạng thái đơn hàng về Đang giao?', 'Đã trả về Đang giao.')
      },
      {
        id: 'btn_dathutien',
        label: 'Đã thu tiền',
        show: (isNVKD || isNVKHO) && status === 'dagiao',
        type: 'primary',
        onClick: () => handleUpdateStatus('dathutien', 'Xác nhận kế toán đã thu đủ tiền đơn hàng này?', 'Đã xác nhận thu tiền.')
      },
      {
        id: 'btn_back_dagiao',
        label: 'Lùi về Đã giao',
        show: (isNVKD || isNVKHO) && status === 'dathutien',
        onClick: () => handleUpdateStatus('dagiao', 'Lùi trạng thái đơn hàng về Đã giao?', 'Đã trả về Đã giao.')
      },
      {
        id: 'btn_hoanthanh',
        label: 'Hoàn thành',
        show: (isNVKD || isNVKHO) && status === 'dathutien',
        type: 'primary',
        onClick: () => handleUpdateStatus('hoanthanh', 'Xác nhận HOÀN THÀNH đóng luồng đơn hàng này?', 'Đơn hàng đã hoàn thành xong! 🏆')
      },
      {
        id: 'btn_back_dathutien',
        label: 'Lùi về Đã thu tiền',
        show: (isNVKD || isNVKHO) && status === 'hoanthanh',
        onClick: () => handleUpdateStatus('dathutien', 'Lùi trạng thái đơn hàng về Đã thu tiền?', 'Đã trả về Đã thu tiền.')
      },
      {
        // 🖨️ NÚT IN PHIẾU ĐÓNG GÓI
        id: 'btn_print_packing',
        label: 'In phiếu đóng gói',
        // Giữ nguyên logic phân quyền đối xứng từ backend truyền xuống
        show: isNVKD || isNVKHO,
        onClick: () => {
          // Luồng 1: Nếu chạy trên môi trường Production SuiteCRM (Có sẵn hàm gắn từ PHP)
          if (typeof window.showPackingPdfPopup === 'function') {
            window.showPackingPdfPopup();
          } 
          // Luồng 2: Dự phòng cho môi trường dev local độc lập (Vite Port 5173)
          else {
            const PACKING_TEMPLATE_ID = '7e8e6dc3-65a2-4ab8-ac1e-130c9212d11f'; 
            const path = `/index.php?entryPoint=preview_packing_pdf&templateID=${PACKING_TEMPLATE_ID}&uid=${recordId}&module_name=sgt_orders`;
            const targetUrl = window.location.port === '5173' ? `http://localhost/baotramb1${path}` : path;
            window.open(targetUrl, '_blank');
          }
        }
      },
      {
        // 🖨️ NÚT IN HÓA ĐƠN
        id: 'btn_print_invoice',
        label: 'In hóa đơn',
        show: isNVKD || isNVKHO,
        onClick: () => {
          // Luồng 1: Nếu chạy trên môi trường Production SuiteCRM (Có sẵn hàm gắn từ PHP)
          if (typeof window.showInvoicePdfPopup === 'function') {
            window.showInvoicePdfPopup();
          } 
          // Luồng 2: Dự phòng cho môi trường dev local độc lập (Vite Port 5173)
          else {
            const INVOICE_TEMPLATE_ID = '8e7dbf93-b941-440e-8d10-eee68b8c006b'; 
            const path = `/index.php?entryPoint=preview_invoice_pdf&templateID=${INVOICE_TEMPLATE_ID}&uid=${recordId}&module_name=sgt_orders`;
            const targetUrl = window.location.port === '5173' ? `http://localhost/baotramb1${path}` : path;
            window.open(targetUrl, '_blank');
          }
        }
      }
    ];

    return orderButtons.map(btn => {
      if (!btn.show) return null;
      return (
        <Button
          key={btn.id}
          id={btn.id}
          type={btn.type || 'default'}
          size="large"
          className={btn.type === 'primary' ? 'btn-primary-custom' : ''}
          onClick={btn.onClick}
        >
          {btn.label}
        </Button>
      );
    });
  };

  if (loading || !layout || !formData) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const allPanels = layout.panels || [];
  const allTabs = layout.tabs || [];
  const lineItemsPanels = layout.line_items_panels || [];
  const hasTabs = allTabs.length > 0;

  return (
    <div className="page" style={{ minHeight: '100vh', paddingBottom: '32px', background: '#f8fafc' }}>

    {/* ==================================================================== */}
      {/* 📦 MODAL CHỌN ĐƠN VỊ VẬN CHUYỂN KHI XUẤT KHO (REACT & ANT DESIGN) */}
      {/* ==================================================================== */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Chọn đơn vị vận chuyển</Title>}
        open={isXuatKhoModalOpen}
        onCancel={() => {
          setIsXuatKhoModalOpen(false);
          xuatKhoForm.resetFields();
        }}
        footer={null} // Quản lý footer thông qua nút của Form để dùng tính năng validate tự động
        destroyOnHidden
        width={450}
      >
        <Form
          form={xuatKhoForm}
          layout="vertical"
          onFinish={handleSubmitXuatKho}
          style={{ marginTop: '16px' }}
        >
          {/* Ô tìm kiếm Đơn vị vận chuyển có Auto-complete lọc theo Tên hoặc SĐT */}
          <Form.Item
            name="shippingUnitId"
            label={<strong>Đơn vị vận chuyển:</strong>}
            rules={[{ required: true, message: 'Vui lòng chọn đơn vị vận chuyển!' }]}
          >
            <Select
              showSearch
              placeholder="Nhập tên hoặc số điện thoại để tìm..."
              optionFilterProp="children"
              onChange={handleSelectShippingUnit}
              filterOption={(input, option) => {
                const u = option?.unitdata;
                return (u?.name || '').toLowerCase().includes(input.toLowerCase()) || 
                       (u?.phone || '').toLowerCase().includes(input.toLowerCase());
              }}
            >
              {shippingUnits.map(unit => (
                <Select.Option key={unit.id} value={unit.id} unitdata={unit}>
                  {unit.name} {unit.phone ? `(${unit.phone})` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="shipperName" label="Tên tài xế:">
            <Input placeholder="Nhập hoặc tự động điền từ đơn vị" size="large" />
          </Form.Item>

          <Form.Item name="shipperPhone" label="SĐT tài xế:">
            <Input placeholder="Nhập hoặc tự động điền từ đơn vị" size="large" />
          </Form.Item>

          <Form.Item name="shipperNotes" label="Ghi chú:">
            <Input.TextArea placeholder="Thông tin bổ sung" rows={3} />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Button size="large" onClick={() => { setIsXuatKhoModalOpen(false); xuatKhoForm.resetFields(); }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" size="large" loading={isSubmitLoading} style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}>
              Tiếp tục
            </Button>
          </div>
        </Form>
      </Modal>
      
      {/* HEADER TÁC VỤ MAN DETAILVIEW TỔNG QUÁT */}
      <div className="header" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
            {layout.module_label || 'Chi tiết bản ghi'} #{formData?.name || recordId}
          </Title>
        </div>
        
        <div className="header-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {layout.module === 'sgt_orders' ? (
            renderOrderActionButtons()
          ) : (
            <Button 
              type="primary" 
              size="large" 
              className="btn-primary-custom"
              onClick={() => {
                window.location.href = `/index.php?module=${layout.module}&action=EditView&record=${recordId}`;
              }}
            >
              Chỉnh sửa bản ghi
            </Button>
          )}

          {urls?.url_list && (
            <Button size='large' onClick={() => (window.location.href = urls.url_list)}>
              Danh Sách
            </Button>
          )}
        </div>
      </div>

      {/* PHÂN KHU THÔNG TIN CHA DYNAMIC */}
      <Row gutter={[16, 16]} className="workspace" style={{ padding: '20px 24px' }}>
        <Col xs={24} lg={hasTabs ? 17 : 24}>
          <FormPanels 
            allPanels={allPanels}
            formData={formData}
            handleFormChange={handleFormChange}
            cleanSystemLabel={cleanSystemLabel}
            RenderField={(props) => (
              <CustomRenderDetailRouter 
                {...props} 
                formData={formData} 
                RenderField={RenderFieldDetail} 
              />
            )}
          />
        </Col>

        {hasTabs && (
          <Col xs={24} lg={7}>
            <FormTabs 
              allTabs={allTabs}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={(props) => (
                <CustomRenderDetailRouter 
                  {...props} 
                  formData={formData} 
                  RenderField={RenderFieldDetail} 
                />
              )}
              setWarehouseId={setWarehouseId} 
              moduleName={layout.module_label || layout.module} 
              setPromoType={() => {}} 
              setPromoMethod={() => {}} 
            />
          </Col>
        )}
      </Row>

      {/* SECTION BẢNG CON ĐỘNG - PHÂN PHỐI ĐỐI XỨNG READ-ONLY TUYỆT ĐỐI */}
      <div style={{ padding: '0 24px' }}>
        {layout.module === 'sgt_sale_offs' ? (
          (lineItemsPanels || []).map((panel, index) => {
            const moduleKey = panel.line_item_source_module;
            
            const selectedPromoType = formData?.promo_type;      
            const selectedMethod    = formData?.methods;         
            const selectedPromoProdType  = formData?.promo_prod_type; 

            const isMatched = 
              (selectedMethod === 'discount_total_order' && moduleKey === 'sgt_disc_order') ||
              (selectedMethod === 'discount_by_product' && moduleKey === 'sgt_disc_product') ||
              (selectedMethod === 'discount_qty_product' && moduleKey === 'sgt_discount_qty') ||
              (selectedMethod === 'free_gifts_by_product' && moduleKey === 'sgt_gifts_by_product') ||
              (selectedMethod === 'free_gifts_total_order' && moduleKey === 'sgt_gifts_order');

            if (!isMatched) return null;

            return (
              <UniversalLineItemSection
                key={moduleKey || index}
                fields={panel.fields || []} 
                lineItemLabel={panel.line_item_source_module_label}
                dataSource={panelsData[moduleKey] || []} 
                promoType={selectedPromoType}
                promoProdType={selectedPromoProdType}
                selectedMethod={selectedMethod}
                isDiscountQty={moduleKey === 'sgt_discount_qty'} 
              />
            );
          })
        ) : (
          (lineItemsPanels || []).map((panel, index) => {
            const moduleKey = panel.line_item_source_module;

            if (moduleKey === 'sgt_orderdetail') {
              return (
                <LineItemsSection 
                  key={moduleKey || index}
                  panel={panel}
                  lineItems={lineItems}
                  formData={formData} 
                  cleanSystemLabel={cleanSystemLabel}
                />
              );
            } 
            
            if (moduleKey === 'sgt_price_policy') {
              return (
                <PricePolicySection
                  key={moduleKey || index}
                  fields={panel.fields || []}
                  lineItemLabel={panel.line_item_source_module_label}
                  pricePolicies={panelsData[moduleKey] || []}
                />
              );
            }

            return (
              <UniversalLineItemSection
                key={moduleKey || index}
                fields={panel.fields || []} 
                lineItemLabel={panel.line_item_source_module_label || 'Cấu hình chi tiết'}
                dataSource={panelsData[moduleKey] || []} 
                isDiscountQty={false} 
                promoType={null}      
              />
            );
          })
        )}
      </div>
    </div>
  );
}