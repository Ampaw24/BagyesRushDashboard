/**
 * The response envelope every V1 controller returns, defined once in
 * app/Http/Controllers/Api/V1/ApiController.php on the backend.
 */
export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  /** Only present when the backend has field-level detail (422, and some domain errors). */
  errors?: Record<string, string[]>;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

/**
 * Laravel's own paginator wrapper is replaced by `paginatedSuccess()`, so there
 * are no `meta` / `links` keys — the page lives under `data.pagination`.
 */
export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  /** null when the page is empty. */
  from: number | null;
  to: number | null;
  has_more: boolean;
};

export type Paginated<T> = {
  items: T[];
  pagination: PaginationMeta;
};

/** A page of already-mapped view models, carrying the backend's pagination block. */
export type Page<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function mapPage<TDto, TModel>(page: Paginated<TDto>, map: (dto: TDto) => TModel): Page<TModel> {
  return { items: page.items.map(map), pagination: page.pagination };
}

/** An empty page, for rendering a list the current admin lacks permission to read. */
export function emptyPage<T>(perPage: number): Page<T> {
  return {
    items: [],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: perPage,
      total: 0,
      from: null,
      to: null,
      has_more: false,
    },
  };
}
