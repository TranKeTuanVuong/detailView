import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Modal, Table, Button, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { RelateApi } from '../services/useApi/RelateApi';

export default function RelateModelSelect({
  field,
  value,
  onChange,
  placeholder,
  disabled
}) {
  const {
    listview,
    dataSource,
    searchText,
    isModalOpen,
    pageParams,
    loading,
    setSearchText,
    setIsModalOpen,
    setPageParams,
    handleListview
  } = RelateApi(field);

  const relatedModule = field?.related_module;

  // ========================
  // SEARCH
  // ========================
  const handleSearch = useCallback(() => {
    setPageParams(prev => ({ ...prev, page: 1 }));
    handleListview(relatedModule, 1, searchText);
  }, [relatedModule, searchText, setPageParams, handleListview]);

  // ========================
  // SELECT ROW
  // ========================
  const handleSelectRow = useCallback((record) => {
    onChange?.({
      id: record.id,
      name: record.name || record.text || ''
    });
    setIsModalOpen(false);
  }, [onChange, setIsModalOpen]);

  // ========================
  // VALUE DISPLAY
  // ========================
  const inputValue = useMemo(() => {
    if (!value) return '';
    if (typeof value === 'object') return value?.name || '';
    return '';
  }, [value]);

  // ========================
  // ENUM MAP (OPTIMIZED)
  // ========================
  const enumMap = useMemo(() => {
    const map = {};
    listview?.fields?.forEach(f => {
      if (f.type === 'enum' && f.options) {
        map[f.name] = Object.fromEntries(
          f.options.map(opt => [
            String(opt.value).toLowerCase(),
            opt.label
          ])
        );
      }
    });
    return map;
  }, [listview]);

  // ========================
  // DYNAMIC COLUMNS
  // ========================
  const columns = useMemo(() => {
    if (!listview?.fields) return [];

    return listview.fields
      .filter(f => f.name && f.name.toLowerCase() !== 'id')
      .map(f => {
        const base = {
          title: f.label,
          dataIndex: f.name,
          key: f.name,
          ellipsis: true
        };

        switch (f.type) {
          case 'name':
            return {
              ...base,
              render: (text, record) => (
                <Button
                  type="link"
                  onClick={() => handleSelectRow(record)}
                  style={{ padding: 0, fontWeight: 600 }}
                >
                  {text || '---'}
                </Button>
              )
            };

          case 'enum':
            return {
              ...base,
              align: 'center',
              render: (v) => {
                if (!v) return '---';
                const label =
                  enumMap[f.name]?.[String(v).toLowerCase()] || v;

                return (
                  <Tag color="blue">
                    {label}
                  </Tag>
                );
              }
            };

          case 'currency':
          case 'decimal':
          case 'float':
            return {
              ...base,
              align: 'right',
              render: (v) =>
                v != null ? `${Number(v).toLocaleString()} đ` : '0 đ'
            };

          case 'bool':
            return {
              ...base,
              align: 'center',
              render: (v) => {
                const ok = v === 1 || v === true || v === '1';
                return (
                  <Tag color={ok ? 'green' : 'default'}>
                    {ok ? 'Có' : 'Không'}
                  </Tag>
                );
              }
            };

          case 'date':
            return {
              ...base,
              align: 'center',
              render: (v) =>
                v ? dayjs(v).format('DD/MM/YYYY') : '---'
            };

          case 'datetime':
          case 'datetimecombo':
            return {
              ...base,
              align: 'center',
              render: (v) =>
                v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '---'
            };

          case 'relate':
            return {
              ...base,
              render: (v) =>
                typeof v === 'object' ? v?.name : v || '---'
            };

          default:
            return base;
        }
      });
  }, [listview, enumMap, handleSelectRow]);

  // ========================
  // UI
  // ========================
  return (
    <>
      <Input
        placeholder={placeholder}
        disabled={disabled}
        value={inputValue}
        readOnly
        onClick={() => !disabled && setIsModalOpen(true)}
        suffix={
          <SearchOutlined
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) setIsModalOpen(true);
            }}
            style={{ cursor: 'pointer' }}
          />
        }
      />

      <Modal
        title={`Danh sách: ${placeholder}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={1000}
        style={{ top: 40 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm..."
            allowClear
            enterButton="Tìm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        <Table
          loading={loading}
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          size="small"
          bordered
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pageParams.page,
            pageSize: pageParams.limit,
            total: pageParams.total,
            showSizeChanger: false,
            showTotal: (t, r) =>
              `${r[0]}-${r[1]} của ${t}`
          }}
          onChange={(pag) => {
            setPageParams(prev => ({
              ...prev,
              page: pag.current
            }));
          }}
          onRow={(record) => ({
            onDoubleClick: () => handleSelectRow(record)
          })}
        />
      </Modal>
    </>
  );
}