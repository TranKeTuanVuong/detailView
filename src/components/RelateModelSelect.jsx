import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Modal, Table, Button, Badge,Tag } from 'antd';
import dayjs from 'dayjs';
import { RelateApi } from '../services/useApi/RelateApi';




export default function RelateModelSelect({ field, value, onChange, placeholder, disabled }) {
 
  const {
     listview,
        statusMap,
        dataSource,
        searchText,
        isModalOpen,
        pageParams,
        loading,
        setDataSource,
        setSearchText,
        setIsModalOpen,
        setPageParams,
         handleListview
      } = RelateApi(field);

  
  


  
  const handleSearch = () => {
    setPageParams(prev => ({ ...prev, page: 1 }));
   handleListview(field.related_module,1, searchText);
  };

  const handleSelectRow = (record) => {
    if (onChange) {
      onChange({
        id: record.id,
        name: record.name || record.text || '', 
      });
    }
    setIsModalOpen(false);
  };

  // 🔥 ĐỘNG HOÁ COLUMNS DỰA THEO KIỂU DỮ LIỆU JSON CỦA SUITECRM (ĐÃ BỎ STATUSMAP & BỎ QUA CỘT ID)
const dynamicColumns = useMemo(() => {
  if (!listview?.fields) return [];

  return listview.fields
    // 🔥 LỌC BỎ: Nếu tên trường là 'id' (bất kể viết hoa/thường) thì không hiển thị lên Table columns
    .filter((f) => f.name && f.name.toLowerCase() !== 'id')
    .map((f) => {
      const baseCol = {
        title: f.label,
        dataIndex: f.name,
        key: f.name,
        ellipsis: true,
      };

      switch (f.type) {
        case 'name':
          return {
            ...baseCol,
            render: (text, record) => (
              <Button type="link" onClick={() => handleSelectRow(record)} style={{ padding: 0, textAlign: 'left', fontWeight: 600 }}>
                {text || '---'}
              </Button>
            )
          };

        case 'enum':
          return {
            ...baseCol,
            align: 'center', 
            render: (v) => {
              if (v === undefined || v === null || v === '') return '---';

              const matchedOption = (f.options || []).find(
                opt => String(opt.value).trim().toLowerCase() === String(v).trim().toLowerCase()
              );

              return (
                <Tag color="blue" style={{ fontWeight: 500, borderRadius: '4px' }}>
                  {matchedOption ? matchedOption.label : v}
                </Tag>
              );
            }
          };

        case 'currency':
        case 'decimal':
        case 'float':
          return {
            ...baseCol,
            align: 'right',
            render: (v) => (v !== undefined && v !== null) ? `${Number(v).toLocaleString()} đ` : '0 đ'
          };

        case 'bool':
          return {
            ...baseCol,
            align: 'center',
            render: (v) => {
              const isTrue = v === 1 || v === true || v === '1';
              return (
                <Tag color={isTrue ? 'success' : 'default'}>
                  {isTrue ? 'Đã kích hoạt' : 'Chưa'}
                </Tag>
              );
            }
          };

        case 'date':
          return {
            ...baseCol,
            align: 'center',
            render: (v) => v ? dayjs(v).format('DD/MM/YYYY') : '---'
          };

        case 'datetime':
        case 'datetimecombo':
          return {
            ...baseCol,
            align: 'center',
            render: (v) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '---'
          };

        case 'relate':
          return {
            ...baseCol,
            render: (v) => (typeof v === 'object' ? v?.name : v) || '---'
          };

        default:
          return baseCol;
      }
    });
}, [listview, handleSelectRow]);
  return (
    <>
      <Input
        placeholder={placeholder}
        disabled={disabled}
        value={value?.name || ''} 
        readOnly
        onClick={() => !disabled && setIsModalOpen(true)}
        suffix={
          <Button 
            type="text" 
            size="small" 
            icon="🔍" 
            style={{ margin: 0, padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              if(!disabled) setIsModalOpen(true);
            }} 
          />
        }
      />

      <Modal
        title={`Danh sách lựa chọn: ${placeholder}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={1000} // Tăng nhẹ width lên 1000px vì cấu trúc JSON có khá nhiều cột hiển thị
        style={{ top: 40 }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm nhanh bản ghi tại đây..."
            allowClear
            enterButton="Tìm kiếm"
            size="middle"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        <Table
          loading={loading}
          dataSource={dataSource}
          columns={dynamicColumns} // Thừa hưởng cấu trúc mảng cột động
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: 'max-content' }} // Cho phép scroll ngang nếu các cột cấu hình quá dài
          pagination={{
            current: pageParams.page,
            pageSize: pageParams.limit,
            total: pageParams.total,
            showSizeChanger: false,
            showTotal: (total, range) => `(${range[0]} - ${range[1]} của ${total})`,
            placement: 'bottomRight'
          }}
          onChange={(pag) => {
            setPageParams(prev => ({ ...prev, page: pag.current }));
          }}
          onRow={(record) => ({
            onDoubleClick: () => handleSelectRow(record),
          })}
        />
      </Modal>
    </>
  );
}