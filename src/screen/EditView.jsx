import React, { useState } from 'react';
import { Row, Col, Typography, Input, Select, DatePicker, Checkbox, InputNumber, Button, Spin } from 'antd';
import dayjs from 'dayjs';

import RelateModelSelect from '../components/RelateModelSelect';
import { DetailApi } from '../services/useApi/DetaialApi';

// Import 3 Subcomponents vừa tách lẻ
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

/* ================= COMPONENT ĐIỀU PHỐI FIELD RENDERER ================= */
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

/* ================= MAIN CONFIG VIEW ================= */
export default function EditView() {
  const {
  urls,
  layout,
  loading,
  module,
  setModule,
  handleLayOut
} = DetailApi();
  const [formData, setFormData] = useState({});
  const [lineItems, setLineItems] = useState([]);
  // 🔥 1. KHỞI TẠO STATE CHỨA MẢNG CHÍNH SÁCH GIÁ ĐỘNG (Mặc định cho sẵn 1 dòng ban đầu giống ảnh)
  const [pricePolicies, setPricePolicies] = useState([
    { id: 'policy_init',group_customer:{ group_customer_id: undefined,group_customer_name:undefined}, upc: '', price_without_vat: '' }
  ]);

  const handleFormChange = (fieldName, newValue) => {
    setFormData(prev => ({ ...prev, [fieldName]: newValue }));
  };

  const handleSaveForm = () => {
    const formattedFormData = { ...formData };
    const activePanelsAndTabs = [...(layout?.panels || []), ...(layout?.tabs || [])];
    
    activePanelsAndTabs.forEach(section => {
      (section.fields || []).forEach(field => {
        if ((field.type === 'relate' || field.type === 'flex_relate') && formattedFormData[field.name]) {
          const relateObj = formattedFormData[field.name];
          if (typeof relateObj === 'object') {
            formattedFormData[`${field.name}_id`] = relateObj.id; 
            formattedFormData[field.name] = relateObj.name;       
          }
        }
      });
    });

    const finalPayload = {
      module: layout?.module,
      form_data: formattedFormData, 
      line_items: lineItems,
      price_policies:pricePolicies      
    };

    console.log("🚀 [FINAL PAYLOAD TO API]:", finalPayload);
    alert("Đã gom dữ liệu thành công! Xem chi tiết tại tab Console.");
  };

  if (loading || !layout) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" description="Đang tải cấu hình dữ liệu..." />
      </div>
    );
  }

  const allPanels = layout.panels || [];
  const allTabs = layout.tabs || [];
  const lineItemsPanels = layout.line_items_panels || [];

  const hasTabs = allTabs.length > 0;

  /* ================= HOOK XỬ LÝ CHỌN SẢN PHẨM Ở BẢNG CON ================= */
  const handleSelectProduct = (productId, option) => {
    const selectedProduct = option.product || {};
    setLineItems(prev => {
      const isExist = prev.some(item => item.line_item_c === productId);
      if (isExist) {
        return prev.map(item => {
          if (item.line_item_c !== productId) return item;
          const newQty = Number(item.qty_c || 0) + 1;
          const price = Number(item.price_c || 0);
          const discount = Number(item.discount_sp_c || 0);
          const discType = item.discount_type_sp_c || 'direct';
          let total = price * newQty;
          if (discType === 'percent') total -= (total * discount / 100);
          else total -= (discount * newQty);

          return { ...item, qty_c: newQty, origin_amount: total > 0 ? total : 0 };
        });
      }
      return [
        ...prev,
        {
          id: Date.now(), 
          line_item_c: productId,
          name_sp_c: selectedProduct.name || option.label,
          product_image_c: selectedProduct.image || '',
          price_c: Number(selectedProduct.price || 0),
          discount_sp_c: 0,
          discount_type_sp_c: 'direct', 
          qty_c: 1, 
          shipment_data: selectedProduct.shipment_data[0],
          origin_amount: Number(selectedProduct.price || 0)
        }
      ];
    });
  };

  const handleRemoveLine = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleTableFieldChange = (id, fieldName, value) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [fieldName]: value };
      const qty = Number(updatedItem.qty_c || 0);
      const price = Number(updatedItem.price_c || 0);
      const discount = Number(updatedItem.discount_sp_c || 0);
      const discType = updatedItem.discount_type_sp_c || 'direct';

      let total = price * qty;
      if (discType === 'percent') total -= (total * discount / 100);
      else total -= (discount * qty);
      
      updatedItem.origin_amount = total > 0 ? total : 0;
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

  <Button
    type="primary"
    size="large"
    className="btn-primary-custom"
   onClick={() => handleLayOut(module)}
  >
    Load lại
  </Button>
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

{/* CORE WORKSPACE AREA */}
<Row 
  gutter={[16, 16]} 
  className="workspace" 
  style={{ display: 'flex', alignItems: 'stretch' }} // Kéo giãn các Col bằng nhau tăm tắp ở đáy
>
  {/* LEFT COLUMN - PANELS */}
  <Col 
    xs={24} 
    lg={hasTabs ? 17 : 24} 
    style={{ display: 'flex', flexDirection: 'column' }}
  >
  {layout.module == "sgt_orders" ? 
  (<FormPanelsSearch
      allPanels={allPanels}
      formData={formData}
      handleFormChange={handleFormChange}
      cleanSystemLabel={cleanSystemLabel}
      RenderField={RenderField}
  />):(<FormPanels 
      allPanels={allPanels}
      formData={formData}
      handleFormChange={handleFormChange}
      cleanSystemLabel={cleanSystemLabel}
      RenderField={RenderField}
    />)}
  </Col>

  {/* RIGHT COLUMN - TABS */}
  {hasTabs && (
    <Col 
      xs={24} 
      lg={7} 
      style={{ display: 'flex', flexDirection: 'column' }} // Ép cột Tab cao full bằng cột trái
    >
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

      {/* ================= LINE ITEMS SECTION ================= */}
      {lineItemsPanels.map((panel,index) => {
  // Điều kiện 1: Nếu là module chính sách giá thì render bảng chính sách giá
  if (panel.line_item_source_module === 'Sgt_price_policy') {
    return (
      <PricePolicySection 
        key={index}
        nameModule={'sgt_group_customer'}
        placeholder={'Nhóm khách hàng'}
        pricePolicies={pricePolicies}
        setPricePolicies={setPricePolicies}
      />
    );
  }

  // Điều kiện 2: Các module còn lại (như đơn hàng, sản phẩm...) thì render bảng sản phẩm thường
  return (
    <LineItemsSection 
      key={index}
      panel={panel} // 🔥 SỬA: Chỉ truyền panel hiện tại thay vì truyền cả mảng lineItemsPanels
      lineItems={lineItems}
      setLineItems={setLineItems}
      formData={formData}                  
      handleFormChange={handleFormChange}  
      handleSelectProduct={handleSelectProduct}
      handleRemoveLine={handleRemoveLine}
      handleTableFieldChange={handleTableFieldChange}
      cleanSystemLabel={cleanSystemLabel}
    />
  );
})}
    </div>
  );
}