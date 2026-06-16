import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Modal, Checkbox, Spin, Empty, Button, Row, Col, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';

const { Text } = Typography;

export default function GroupCustomerSelect({ value, onChange, disabled }) {
  const [isModalOpen, setIsXuatKhoModalOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]); // Chứa toàn bộ list từ API [{id, name}]
  const [searchKeyword, setSearchKeyword] = useState('');

  // 1. Chuyển đổi chuỗi "Nhóm A;Nhóm B" từ CRM thành mảng tạm thời để Checkbox nhận diện trạng thái [checked]
  const checkedList = useMemo(() => {
    if (!value || String(value).trim() === '') return [];
    return String(value).split(';').map(item => item.trim()).filter(Boolean);
  }, [value]);

  // Trạng thái mảng chọn tạm thời trong Modal trước khi bấm "Xác nhận"
  const [tempCheckedList, setTempCheckedList] = useState([]);

  // 2. Hàm gọi Ajax tra cứu dữ liệu từ PHP EntryPoint
  const fetchGroupCustomers = async (keyword) => {
    setFetching(true);
    try {
      const response = await fetch(`./index.php?entryPoint=pickGroupCustomerAjax&q=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setOptions(data); // Lưu nguyên bản [{id, name}] phục vụ render checkbox
      }
    } catch (error) {
      console.error('⚠️ Lỗi tải danh sách nhóm khách hàng:', error);
    } finally {
      setFetching(false);
    }
  };

  // 3. Kỹ thuật Debounce cho ô tìm kiếm trong Modal
  const debounceSearch = useCallback(
    debounce((nextValue) => fetchGroupCustomers(nextValue), 400),
    []
  );

  const handleSearchChange = (e) => {
    const { value: val } = e.target;
    setSearchKeyword(val);
    debounceSearch(val);
  };

  // 4. Hành vi khi bấm vào ô input text chính diện
  const handleOpenModal = () => {
    if (disabled) return;
    setTempCheckedList([...checkedList]); // Sync dữ liệu đã chọn ngoài form vào state tạm của Modal
    setSearchKeyword('');
    fetchGroupCustomers(''); // Reset list mới khi mở modal
    setIsXuatKhoModalOpen(true);
  };

  // 5. Xử lý Toggle Checkbox (Chọn hoặc bỏ chọn một dòng)
  const handleCheckboxChange = (name, checked) => {
    if (checked) {
      setTempCheckedList(prev => [...prev, name]);
    } else {
      setTempCheckedList(prev => prev.filter(item => item !== name));
    }
  };

  // 6. Nhấn "Xác nhận chọn" -> Gộp mảng thành chuỗi bắn về cho Form cha lưu vào SuiteCRM
  const handleSave = () => {
    const finalString = tempCheckedList.join(';');
    if (onChange) {
      onChange(finalString);
    }
    setIsXuatKhoModalOpen(false);
  };

  return (
    <>
      {/* Ô Input hiển thị chính diện trên Form layout */}
      <Input
        readOnly
        disabled={disabled}
        placeholder="Click để chọn các Nhóm khách hàng..."
        value={value || ''}
        onClick={handleOpenModal}
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          backgroundColor: disabled ? '#f5f5f5' : '#fff' 
        }}
      />

      {/* 📦 MODAL CHỌN NHÓM KHÁCH HÀNG CHUẨN ANT DESIGN */}
      <Modal
        title={<span style={{ fontWeight: 600, fontSize: 16 }}>Chọn Nhóm khách hàng</span>}
        open={isModalOpen}
        onCancel={() => setIsXuatKhoModalOpen(false)}
        width={500}
        destroyOnClose
        footer={[
          <Button key="back" onClick={() => setIsXuatKhoModalOpen(false)}>
            Hủy bỏ
          </Button>,
          <Button key="submit" type="primary" onClick={handleSave} style={{ backgroundColor: '#0088FF', borderColor: '#0088FF' }}>
            Xác nhận chọn
          </Button>,
        ]}
      >
        {/* Thanh tìm kiếm bên trong Modal */}
        <div style={{ margin: '12px 0' }}>
          <Input
            placeholder="Nhập tên nhóm cần tìm..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchKeyword}
            onChange={handleSearchChange}
          />
        </div>

        {/* Khung chứa danh sách dòng dạng Checkbox */}
        <div 
          style={{ 
            height: '300px', 
            overflowY: 'auto', 
            border: '1px solid #f0f0f0', 
            borderRadius: '6px',
            padding: '8px 12px',
            background: '#fafafa'
          }}
        >
          {fetching ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Đang tải dữ liệu...</Text>
            </div>
          ) : options.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {options.map((item) => {
                const isChecked = tempCheckedList.includes(item.name);
                return (
                  <Row 
                    key={item.id} 
                    align="middle" 
                    style={{ 
                      padding: '8px 4px', 
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      background: isChecked ? '#e6f7ff' : 'transparent', // Đổi màu nền nhẹ nếu được chọn
                      borderRadius: '4px'
                    }}
                    onClick={() => handleCheckboxChange(item.name, !isChecked)}
                  >
                    <Col span={3} style={{ textAlign: 'center' }}>
                      <Checkbox 
                        checked={isChecked}
                        onChange={(e) => {
                          // Chặn nổi bọt sự kiện để tránh trigger click 2 lần khi bấm thẳng vào ô vuông checkbox
                          e.stopPropagation(); 
                          handleCheckboxChange(item.name, e.target.checked);
                        }}
                      />
                    </Col>
                    <Col span={21}>
                      <Text style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{item.name}</Text>
                    </Col>
                  </Row>
                );
              })}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy nhóm khách hàng nào" />
          )}
        </div>
      </Modal>
    </>
  );
}