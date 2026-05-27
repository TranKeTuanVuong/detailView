const API_URL = import.meta.env.DEV
  ? ''
  : 'https://demo.saigongreentech.com';

/**
 * Lấy cấu trúc layout EditView
 */
export const fetchEditViewLayout = async (
  module: string,
  type: string
) => {
  try {
    
    const response = await fetch(
      `${API_URL}/index.php?entryPoint=meta_layout&module=${module}&type=${type}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Layout api service error:', error);
    throw error;
  }
};

/**
 * List view
 */
export const fetchListViewLayout = async (
  module: string,
  page = 1,
  limit = 10,
  currentSearch = ''
) => {
  try {
    const response = await fetch(
      `${API_URL}/index.php?entryPoint=relate_data&module=${module}&page=${page}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(error);
    throw error;
  }
};