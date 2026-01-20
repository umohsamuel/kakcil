export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const getPaginationParams = (
  pageQuery?: string | number,
  limitQuery?: string | number,
): PaginationParams => {
  const page = Math.max(1, parseInt(String(pageQuery || "1")));
  const limit = Math.max(1, parseInt(String(limitQuery || "10")));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};
