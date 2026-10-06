/**
 * Application State Store
 */
export const state = {
  students: [],
  filterStatus: 'All',
  searchQuery: '',
  sortBy: 'created_at',
  sortOrder: -1,
  selectedStudent: null,
  deleteStudentId: null,
  dbConnected: false
};
