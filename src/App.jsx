import React from 'react';
import EditView from './screen/EditView';
import DetailView from './screen/DetailView'; // Import màn hình DetailView thực tế

function App() {
  // 1. Đọc action được inject từ SuiteCRM PHP sang
  const crmConfig = window.suiteCRMConfig || {};
  const action = crmConfig.action; // Sẽ có giá trị: 'Create', 'EditView', hoặc 'DetailView'
  console.log('Current action from SuiteCRM:', action);
  // 2. Logic phân luồng hiển thị độc lập (Routing)
  
  // Nếu là màn hình xem chi tiết
  if (action === 'DetailView') {
    return (
      <div className="App">
        <DetailView />
      </div>
    );
  }

  // Nếu là màn hình Tạo mới (Create) hoặc Chỉnh sửa (EditView)
  return (
    <div className="App">
      <EditView />
    </div>
  );
}

export default App;