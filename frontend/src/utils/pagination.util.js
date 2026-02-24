/**
 * Pagination Utility – chuẩn hóa phân trang trên toàn hệ thống
 *
 * Convention:
 *   query: ?page=1&limit=10
 *   response: { data: [...], meta: { total, page, limit, totalPages } }
 */

/**
 * Lấy và validate tham số phân trang từ query string
 * @returns {{ page: number, limit: number, offset: number }}
 */
exports.parsePagination = (query, defaultLimit = 10) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaultLimit));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

/**
 * Xây dựng metadata trả về cho client
 * @returns {{ total: number, page: number, limit: number, totalPages: number }}
 */
exports.buildMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
});
