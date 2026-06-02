import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Typography, Select, Empty, Checkbox, Divider, Spin } from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  PlusCircleOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

export default function FormPanelsSearch({ allPanels, formData, handleFormChange, cleanSystemLabel, RenderField , setPricePolicyData}) {
  
  // =================================================================
  // 🟢 HỆ THỐNG STATE QUẢN LÝ TÌM KIẾM KHÁCH HÀNG ĐỘNG (DYNAMICAL API)
  // =================================================================
  const [selectedCus, setSelectedCus] = useState(null);
  const [customers, setCustomers] = useState([]); // Chứa danh sách khách nạp từ API
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  
  // Dùng Ref để lưu trữ timer chống nhiễu (Debounce) khi gõ phím tìm kiếm
  const searchTimeoutRef = useRef(null);

  // Hàm gọi API lấy danh sách khách hàng phân nhánh động từ EntryPoint tổng quát
  const fetchCustomersFromAPI = async (searchPage, searchKeyword, isLoadMore = false) => {
    if (fetching && !isLoadMore) return;
    setFetching(true);
    try {
      const url = `./index.php?entryPoint=get_products_search&module=Accounts&page=${searchPage}&limit=20&keyword=${encodeURIComponent(searchKeyword)}`;
      const response = await fetch(url, { method: 'GET' });
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Chuẩn hóa cấu trúc bản ghi DB Accounts tương thích với cấu trúc hiển thị UI Card
        const formatted = result.data.map(acc => ({
          value: acc.id,
          label: acc.name,
          phone: acc.phone_office || '',
          address: acc.shipping_address_street || '',
          makh: acc.makh || '',
          raw: acc // Giữ lại data gốc nếu backend cần dùng sâu về sau
        }));

        setCustomers(prev => isLoadMore ? [...prev, ...formatted] : formatted);
        if (result.pagination) {
          setTotalPages(result.pagination.total_pages || 1);
        }
      } else {
        if (!isLoadMore) setCustomers([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng từ CRM:", error);
    } finally {
      setFetching(false);
    }
  };

  // Khởi chạy tải 20 khách hàng đầu tiên khi component vừa mount
  useEffect(() => {
    fetchCustomersFromAPI(1, '');
  }, []);

  // =================================================================
  // ĐỒNG BỘ: TỰ ĐỘNG HIỂN THỊ DỮ LIỆU CŨ KHI CÓ DATA TỪ DATABASE ĐỔ VỀ
  // =================================================================
  useEffect(() => {
    const currentCustomerId = formData.customer?.id || formData.account_id_c || formData.customer_id;
    
    if (currentCustomerId) {
      const matchedCustomer = customers.find(cus => cus.value === currentCustomerId);
      
      if (matchedCustomer) {
        setSelectedCus(matchedCustomer);
      } else if (formData.customer?.name || formData.account_name) {
        setSelectedCus({
          value: currentCustomerId,
          label: formData.customer?.name || formData.account_name,
          phone: formData.customer_phone || formData.phone_office || '',
          address: formData.shipping_address || formData.shipping_address_street || ''
        });
      }
    } else {
      setSelectedCus(null);
    }
  }, [formData.customer, formData.account_id_c, formData.customer_id, customers]);

  // =================================================================
  // ⚡ XỬ LÝ SỰ KIỆN THAO TÁC TRÊN SELECT DROPDOWN (SEARCH, LOAD MORE)
  // =================================================================
  
  const handleSearchCustomer = (val) => {
    const cleanVal = val.trim();
    setKeyword(cleanVal);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomersFromAPI(1, cleanVal, false);
    }, 400); 
  };

  const handlePopupScroll = (e) => {
    const { target } = e;
    if (Math.ceil(target.scrollTop + target.clientHeight) >= target.scrollHeight - 5) {
      if (!fetching && page < totalPages) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCustomersFromAPI(nextPage, keyword, true);
      }
    }
  };

  // 🔥 ĐÃ TỐI ƯU TỐC ĐỘ: Bốc trực tiếp từ payload option.raw để triệt tiêu delay phản hồi click
  const handleSelectCustomer = (value, option) => {
    if (!option) return;

    // Trích xuất chuỗi tên thuần an toàn
    const cleanLabel = option.label?.props?.children[1]?.props?.children || option.label || '';
    const rawData = option.raw || {};

    setSelectedCus({
      value: value,
      label: cleanLabel,
      phone: option.phone || '',
      address: option.address || ''
    });

    // Cập nhật chính sách giá lập tức từ cục dữ liệu đính kèm ở Option
    const policies = rawData.price_policy_data || [];
    setPricePolicyData(policies);

    // Cập nhật Form chính
    handleFormChange('customer_id', value);
    handleFormChange('account_id_c', value); 
    handleFormChange('account_name', cleanLabel);
    if (option.address) handleFormChange('shipping_address', option.address);
  };

  const handleClearCustomer = () => {
    setSelectedCus(null);
    setPricePolicyData([]); // Trả về mảng rỗng ngay lập tức để LineItemsSection khôi phục lại đơn giá niêm yết cũ
    handleFormChange('customer_id', '');
    handleFormChange('account_id_c', '');
    handleFormChange('account_name', '');
    handleFormChange('customer', null);
  };

  const renderDropdownHeader = (menu) => (
    <div>
      <div 
        style={{ 
          padding: '10px 12px', 
          color: '#1677ff', 
          cursor: 'pointer', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #f0f0f0'
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => alert('Mở modal thêm khách hàng mới')}
      >
        <PlusCircleOutlined style={{ fontSize: 18 }} /> Thêm mới khách hàng
      </div>
      {menu}
      {fetching && (
       <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
        <Spin size="small" description="Đang tải thêm..." />
      </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {allPanels.map((panel) => {
        const isCustomerPanel = panel.key.toLowerCase().includes('customer') || 
                               panel.label.toLowerCase().includes('khách');

        if (isCustomerPanel) {
          return (
            <Card
              key={panel.key}
              title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                  <Col>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Thông tin khách hàng</span>
                  </Col>
                  <Col>
                    <Checkbox 
                      checked={formData.is_invoice === 1 || formData.is_invoice === '1' || formData.is_invoice === true}
                      onChange={(e) => handleFormChange('is_invoice', e.target.checked ? 1 : 0)}
                    >
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#555' }}>
                        PHÁT HÀNH HOÁ ĐƠN ĐIỆN TỬ ℹ️
                      </span>
                    </Checkbox>
                  </Col>
                </Row>
              }
              className="card"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}
              styles={{ body: { padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' } }}
            >
              <div style={{ marginBottom: 20 }}>
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Tìm theo tên, SĐT, mã khách hàng ..."
                  labelInValue 
                  value={selectedCus ? { value: selectedCus.value, label: selectedCus.label } : null}
                  onChange={(val, option) => handleSelectCustomer(val.value, option)}
                  onSearch={handleSearchCustomer}
                  onPopupScroll={handlePopupScroll}
                  popupRender={renderDropdownHeader}
                  filterOption={false}
                  notFoundContent={fetching ? <Spin size="small" description="Đang tải thêm..." /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy khách hàng" />}
                  suffixIcon={<SearchOutlined style={{ fontSize: 18, color: '#bfbfbf' }} />}
                >
                  {customers.map((cus) => (
                    <Select.Option 
                      key={cus.value} 
                      value={cus.value} 
                      phone={cus.phone} 
                      address={cus.address}
                      raw={cus.raw} // 🔥 Đảm bảo truyền raw trực tiếp vào Option ở đây để bốc siêu nhanh
                      label={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserOutlined style={{ color: '#1677ff' }} />
                          <span>{cus.label}</span>
                        </div>
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#e6f4ff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <UserOutlined style={{ color: '#1677ff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Text strong style={{ fontSize: 14 }}>{cus.label}</Text>
                            {cus.makh && <span style={{ fontSize: 10, backgroundColor: '#f5f5f5', padding: '1px 5px', borderRadius: 4, color: '#8c8c8c' }}>{cus.makh}</span>}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{cus.phone !== '' ? cus.phone : 'Không có SĐT'}</Text>
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!selectedCus ? (
                  <Empty styles={{ image: { height: 60, opacity: 0.5 } }} />        
                ) : (
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <Row gutter={[24, 16]} align="top">
                      
                      <Col xs={24} md={16}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Text strong style={{ fontSize: 13, color: '#333', letterSpacing: '0.3px' }}>ĐỊA CHỈ GIAO HÀNG</Text>
                          <Text type="link" style={{ fontSize: 13, cursor: 'pointer' }}>Thay đổi</Text>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text strong style={{ fontSize: 14 }}>
                            {selectedCus.label} {selectedCus.phone ? ` - ${selectedCus.phone}` : ''}
                          </Text>
                          <Text type="secondary" style={{ color: '#555', fontSize: 13, lineHeight: '1.5' }}>
                            {selectedCus.address || 'Chưa cập nhật địa chỉ'}
                          </Text>
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div style={{
                          border: '1px dashed #bfbfbf',
                          borderRadius: '6px',
                          padding: '12px 16px',
                          backgroundColor: '#fafafa',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          fontSize: '13px'
                        }}>
                          <Row justify="space-between">
                            <Text type="secondary">Nợ phải thu</Text>
                            <Text strong style={{ color: '#ff4d4f' }}>0</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Tổng chi tiêu (0 đơn)</Text>
                            <Text strong style={{ color: '#1677ff' }}>0</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Trả hàng (0 sản phẩm)</Text>
                            <Text strong style={{ color: '#ff4d4f' }}>0</Text>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">Giao hàng thất bại (0 đơn)</Text>
                            <Text strong style={{ color: '#ff4d4f' }}>0</Text>
                          </Row>
                        </div>
                      </Col>

                    </Row>

                    <Divider dashed style={{ margin: '16px 0' }} />
                    
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text type="link" style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                          Xem thêm ▾
                        </Text>
                      </Col>
                      <Col>
                        <Text 
                          style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 13, fontWeight: 500 }} 
                          onClick={handleClearCustomer}
                        >
                          ✕ Bỏ chọn khách hàng
                        </Text>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            </Card>
          );
        }

        const rows = {};
        (panel.fields || []).forEach((f) => {
          if (!rows[f.row]) rows[f.row] = [];
          rows[f.row].push(f);
        });

        return (
          <Card
            key={panel.key}
            title={<span className="panel-title-bold">{cleanSystemLabel(panel.label)}</span>}
            className="card"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}
            styles={{ body: { padding: '24px 16px 12px 16px', flex: 1 } }}
          >
            {Object.keys(rows).map((rowKey) => (
              <Row gutter={24} key={rowKey} style={{ marginBottom: 14 }}>
                {rows[rowKey]
                  .sort((a, b) => a.col - b.col)
                  .map((field) => (
                    <Col key={field.name} xs={24} md={rows[rowKey].length > 1 ? 24 / rows[rowKey].length : 12}>
                      <Row gutter={8} align="middle">
                        <Col span={8} style={{ textAlign: 'right', paddingRight: '6px' }}>
                          {!field.hide_label && field.type !== 'bool' && (
                            <Text style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
                              {cleanSystemLabel(field.label)}:
                            </Text>
                          )}
                        </Col>
                        <Col span={field.hide_label || field.type === 'bool' ? 24 : 16}>
                          <RenderField 
                            field={field} 
                            value={formData[field.name]} 
                            onChange={(newVal) => handleFormChange(field.name, newVal)} 
                          />
                        </Col>
                      </Row>
                    </Col>
                  ))}
              </Row>
            ))}
          </Card>
        );
      })}
    </div>
  );
}