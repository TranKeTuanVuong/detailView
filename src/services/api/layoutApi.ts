const API_URL = import.meta.env.VITE_API_URL || 'https://demo.saigongreentech.com/baotramdev';

/**
 * Helper: safe fetch JSON (chống HTML / lỗi SuiteCRM)
 */
async function safeFetchJson(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include', // quan trọng cho SuiteCRM session
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();

  // Debug raw response
  console.log('API URL:', url);
  console.log('RAW RESPONSE:', text);

  // Check HTTP error
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} - ${text}`);
  }

  // Try parse JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

/**
 * Lấy layout EditView
 */
export const fetchEditViewLayout = async (
  module: string,
  type: string
) => {
  const url =
    `${API_URL}/index.php?entryPoint=meta_layout&module=${module}&type=${type}`;

  try {
    return await safeFetchJson(url);
  } catch (error) {
    console.error('Layout API error:', error);
    throw error;
  }
};

/**
 * Lấy ListView / relate data
 */
export const fetchListViewLayout = async (
  module: string,
  page = 1,
  limit = 10,
  currentSearch = ''
) => {
  const url =
    `${API_URL}/index.php?entryPoint=relate_data&module=${module}` +
    `&page=${page}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`;

  try {
    return await safeFetchJson(url);
  } catch (error) {
    console.warn('List API error:', error);
    throw error;
  }
};