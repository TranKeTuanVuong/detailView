import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Input, Select, DatePicker, Checkbox, InputNumber, Button, Spin, message } from 'antd';
import dayjs from 'dayjs';

import RelateModelSelect from '../components/RelateModelSelect';
import { DetailApi } from '../services/useApi/DetaialApi';

// Import các Subcomponents tháp cấu trúc UI vệ tinh
import FormPanels from '../components/FormPanels';
import FormPanelsSearch from '../components/FormPanelsSearch';
import FormTabs from '../components/FormTabs';
import LineItemsSection from '../components/LineItemsSection';
import PricePolicySection from '../components/PricePolicySection';

// Import CSS
import './css/EditView.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

/* ================= LABEL CLEAN ================= */
const cleanSystemLabel = (label) => {
  if (!label) return '';
  const upperLabel = label.trim().toUpperCase();
  if (upperLabel === 'LBL_ORDER_INFORMATION' || upperLabel === 'DEFAULT') return 'Thông tin đơn hàng';
  if (upperLabel === 'LBL_DETAILVIEW_PANEL1') return 'Thông tin chi tiết';
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

/* ================= COMPONENT ĐIỀU PHỐI FIELD RENDERER DYNAMIC ================= */
const RenderField = ({ field, value, onChange }) => {
  const labelText = cleanSystemLabel(field.label);
  const isReadOnly = field.readonly === true || field.readonly === 1;

  const commonProps = { 
    style: { width: '100%' },
    disabled: isReadOnly,
    value: (value !== undefined && value !== null) ? value : '' 
  };

  switch (field.type) {
    case 'varchar':
    case 'name':
    case 'phone':
    case 'iframe':
      return <Input placeholder={labelText} {...commonProps} onChange={(e) => onChange(e.target.value)} />;
    case 'relate':
    case 'flex_relate':
      return <RelateModelSelect field={field} placeholder={field.related_module_label || labelText} disabled={isReadOnly} value={value || null} onChange={onChange} />;
    case 'text':
    case 'address':
    case 'html':
      return <TextArea rows={2} placeholder={labelText} {...commonProps} onChange={(e) => onChange(e.target.value)} />;
    case 'enum':
    case 'dynamicenum':
      return <Select {...commonProps} value={value !== undefined && value !== null ? value : undefined} placeholder={`Chọn ${labelText}`} onChange={(val) => onChange(val)} options={(field.options || []).map((i) => ({ value: i.value, label: i.label }))} />;
    case 'multienum':
      return <Select {...commonProps} value={Array.isArray(value) ? value : []} mode="multiple" placeholder={`Chọn nhiều ${labelText}`} onChange={(vals) => onChange(vals)} options={(field.options || []).map((i) => ({ value: i.value, label: i.label }))} />;
    case 'date':
      return <DatePicker {...commonProps} value={value ? dayjs(value, 'YYYY-MM-DD') : null} format="DD/MM/YYYY" placeholder="Chọn ngày" onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')} />;
    case 'datetime':
    case 'datetimecombo':
      return <DatePicker {...commonProps} value={value ? dayjs(value, 'YYYY-MM-DD HH:mm:ss') : null} showTime format="DD/MM/YYYY HH:mm" placeholder="Chọn ngày giờ" onChange={(date) => onChange(date ? date.format('YYYY-MM-DD HH:mm:ss') : '')} />;
    case 'currency':
    case 'decimal':
    case 'float':
    case 'int':
      return <InputNumber {...commonProps} value={value !== undefined && value !== null ? value : null} min={0} precision={field.type === 'int' ? 0 : undefined} formatter={(v) => field.type === 'currency' ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : v} parser={(v) => v.replace(/,/g, '')} onChange={(val) => onChange(val)} />;
    case 'bool':
      return <Checkbox {...commonProps} checked={value === 1 || value === true || value === '1'} onChange={(e) => onChange(e.target.checked ? 1 : 0)}>{labelText}</Checkbox>;
    default:
      return <Input placeholder={labelText} {...commonProps} onChange={(e) => onChange(e.target.value)} />;
  }
};

/* ================= MAIN CONFIG EDITVIEW ================= */
export default function EditView({ recordId }) {
  const {
    urls,
    layout,
    loading,
    module,
    setModule,
    handleLayOut,handleSave
  } = DetailApi();

  // 1. STATE QUẢN LÝ DỮ LIỆU ĐỘNG TỔNG THỂ
  const [formData, setFormData] = useState({});
  const [panelsData, setPanelsData] = useState({});

  // Cầu nối cô lập cho module chi tiết đơn hàng (sgt_orderdetail)
  const lineItems = panelsData['sgt_orderdetail'] || [];
  const [pricePolicyData, setPricePolicyData] = useState([]);
  const setLineItems = (newDataOrFn) => {
    handlePanelDataChange('sgt_orderdetail', newDataOrFn);
  };

  // 2. KHỞI TẠO MẢNG RỖNG CHO CÁC PANEL NGẪU NHIÊN KHI CẤU TRÚC LAYOUT SẴN SÀNG
  useEffect(() => {
    if (layout?.line_items_panels) {
      const initialEmptyPanels = {};
      layout.line_items_panels.forEach(panel => {
        initialEmptyPanels[panel.line_item_source_module] = [];
      });
      setPanelsData(initialEmptyPanels);
    }
  }, [layout?.line_items_panels]);

  const handleFormChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  // =================================================================
  // ĐÃ SỬA: HÀM CẬP NHẬT PANEL ĐỘNG AN TOÀN TUYỆT ĐỐI (TRÁNH TRÔI/MẤT CHỮ)
  // =================================================================
  const handlePanelDataChange = (moduleKey, dataOrFn) => {
    setPanelsData(prev => {
      const currentPanelData = prev[moduleKey] || [];
      const updatedPanelData = typeof dataOrFn === 'function' 
        ? dataOrFn(currentPanelData) 
        : dataOrFn;

      return {
        ...prev,
        [moduleKey]: updatedPanelData
      };
    });
  };

  // =================================================================
  // ĐỘNG CƠ GOM CỤM ĐỘNG VÀ LƯU DỮ LIỆU TỔNG QUÁT LÊN APIS PHP
  // =================================================================
 const handleSaveForm = async () => {
  const formattedFormData = { ...formData };
  const activePanelsAndTabs = [...(layout?.panels || []), ...(layout?.tabs || [])];
  
  // Chuẩn hóa cấu trúc các trường Relate của ô nhập form chính
  activePanelsAndTabs.forEach(section => {
    (section.fields || []).forEach(field => {
      if ((field.type === 'relate' || field.type === 'flex_relate') && formattedFormData[field.name]) {
        const relateObj = formattedFormData[field.name];
        if (typeof relateObj === 'object') {
          const idFieldName = field.related_id_field || `${field.name}_id`;
          formattedFormData[idFieldName] = relateObj.id; 
          formattedFormData[field.name] = relateObj.name;       
        }
      }
    });
  });

  // Gom dữ liệu các bảng con ngẫu nhiên bám sát theo Metadata Layout đang có
  const dynamicLineItemsData = {};
  (layout?.line_items_panels || []).forEach(panel => {
    const moduleKey = panel.line_item_source_module;
    const rawRows = panelsData[moduleKey] || [];

    // 🔥 TIẾN HÀNH THANH LỌC DỮ LIỆU BẢNG CON TẠI ĐÂY
    dynamicLineItemsData[moduleKey] = rawRows.map(item => {
      // Bóc tách _all_shipments và shipment_data ra ngoài, gom tất cả trường còn lại vào 'cleanItem'
      const { _all_shipments, shipment_data, ...cleanItem } = item;
      
      return cleanItem; // Trả về object sạch chỉ chứa các trường cần lưu xuống Database
    });
  });

  const finalPayload = {
    parent_module: layout?.module,
    parent_id: formattedFormData?.id || recordId || '', 
    parent_fields: formattedFormData,
    line_items_data: dynamicLineItemsData 
  };

  console.log("🚀 [FINAL PAYLOAD ĐÃ ĐƯỢC LỌC SẠCH]:", finalPayload);
  
  // Kích hoạt hàm gọi API lưu chính thức
  // await handleSave(finalPayload);
};
  if (loading || !layout) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" description="Đang tải cấu hình giao diện..." />
      </div>
    );
  }

  const allPanels = layout.panels || [];
  const allTabs = layout.tabs || [];
  const lineItemsPanels = layout.line_items_panels || [];
  const hasTabs = allTabs.length > 0;


  const handleRemoveLine = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleTableFieldChange = (id, fieldName, value) => {
  setLineItems(prev => prev.map(item => {
    if (item.id !== id) return item;

    // 🔥 1. CHẶN KIỂM TRA TỒN KHO KHI THAY ĐỔI SỐ LƯỢNG (qty_c)
    if (fieldName === 'qty_c') {
      const inputQty = Number(value || 0);
      // Bốc số lượng có thể xuất bán tối đa của lô hàng đang chọn tại dòng này
      const maxCanSell = Number(item.shipment_data?.qty_cansell ?? 0);

      if (inputQty > maxCanSell) {
        // Bắn thông báo đẩy cảnh báo người dùng ngoài giao diện
        message.warning(
          `Sản phẩm [${item.name_sp_c || 'Mặt hàng'}] - Lô [${item.shipment_data?.lot_name || 'Mặc định'}] chỉ còn tối đa ${maxCanSell} sản phẩm khả dụng!`
        );
        return item; // 🔴 CHẶN ĐỨNG: Trả về trạng thái item cũ, không cập nhật số lượng quá tải
      }
    }

    // 2. Nếu vượt qua bộ lọc hoặc thay đổi các trường khác (đơn giá, chiết khấu...), tiến hành tính toán lại tổng tiền
    const updatedItem = { ...item, [fieldName]: value };
    const qty = Number(updatedItem.qty_c || 0);
    const price = Number(updatedItem.price_c || 0);
    const discount = Number(updatedItem.discount_sp_c || 0);
    const discType = updatedItem.discount_type_sp_c || 'direct';

    let total = price * qty;
    if (discType === 'percent') {
      total -= (total * discount / 100);
    } else {
      total -= (discount * qty);
    }
    
    updatedItem.origin_amount = total >= 0 ? total : 0;
    return updatedItem;
  }));
};

  return (
    <div className="page" style={{ minHeight: '100vh', paddingBottom: '32px' }}>
      {/* HEADER TÁC VỤ */}
      <div className="header">
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Title level={3} style={{ margin: 0 }}>
                {layout.module_label || 'Chi tiết bản ghi'}
              </Title>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Module:</Text>
                <Input
                  placeholder="Nhập module name"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  style={{ width: 250, marginLeft: 8 }}
                />
              </div>
            </div>
            <Button type="primary" size="large" className="btn-primary-custom" onClick={() => handleLayOut(module)}>Load lại</Button>
          </div>
        </div>
        <div className="header-buttons">
          <Button size="large">Hủy</Button>
          <Button type="primary" size="large" className="btn-primary-custom" onClick={handleSaveForm}>Lưu</Button>
          {urls?.url_list && (
            <Button type='primary' size='large' className="btn-primary-custom" onClick={() => (window.location.href = urls.url_list)}>
              Danh Sách {layout.module_label || ''}
            </Button>
          )}
        </div>
      </div>

      {/* CORE WORKSPACE AREA PANEL BINDING */}
      <Row gutter={[16, 16]} className="workspace" style={{ display: 'flex', alignItems: 'stretch' }}>
        <Col xs={24} lg={hasTabs ? 17 : 24} style={{ display: 'flex', flexDirection: 'column' }}>
          {layout.module === "sgt_orders" ? (
            <FormPanelsSearch
              allPanels={allPanels}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={RenderField}
              
              setPricePolicyData={setPricePolicyData}
            />
          ) : (
            <FormPanels 
              allPanels={allPanels}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={RenderField}
            />
          )}
        </Col>

        {hasTabs && (
          <Col xs={24} lg={7} style={{ display: 'flex', flexDirection: 'column' }}>
            <FormTabs 
              allTabs={allTabs}
              formData={formData}
              handleFormChange={handleFormChange}
              cleanSystemLabel={cleanSystemLabel}
              RenderField={RenderField}
            />
          </Col>
        )}
      </Row>

      {/* ================= ĐOẠN ĐIỀU PHỐI SECTION BẢNG CON ĐỘNG 100% NGẪU NHIÊN ================= */}
      {lineItemsPanels.map((panel, index) => {
        const moduleKey = panel.line_item_source_module;

        // KIỂU 1: Bảng chi tiết đơn hàng sản phẩm thường (Cần UI bốc tách xử lý tính toán tiền)
        if (moduleKey === 'sgt_orderdetail') {
          return (
            <LineItemsSection 
              key={moduleKey || index}
              panel={panel}
              lineItems={lineItems}
              setLineItems={setLineItems}
              formData={formData}                  
              handleFormChange={handleFormChange}  
              pricePolicyData={pricePolicyData}
              handleRemoveLine={handleRemoveLine}
              handleTableFieldChange={handleTableFieldChange}
              cleanSystemLabel={cleanSystemLabel}
            />
          );
        } 
        
        // KIỂU 2: TOÀN BỘ CÁC BẢNG CON NGẪU NHIÊN CÒN LẠI TRÊN ĐỜI (Tự sinh cột theo mảng fields)
        return (
          <PricePolicySection
            key={moduleKey || index}
            fields={panel.fields}
            lineItemLabel={panel.line_item_source_module_label}
            pricePolicies={panelsData[moduleKey] || []} 
            setPricePolicies={(newData) => handlePanelDataChange(moduleKey, newData)} 
            isLayoutLoading={false} // Chuyển hẳn thành false vì không còn luồng fetch dữ liệu cũ cản địa
          />
        );
      })}
    </div>
  );
}