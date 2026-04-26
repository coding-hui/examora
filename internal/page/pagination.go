package page

type Query struct {
	Page     int
	PageSize int
}

func (q Query) Normalize() Query {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.PageSize < 1 {
		q.PageSize = 20
	}
	if q.PageSize > 100 {
		q.PageSize = 100
	}
	return q
}

func (q Query) Offset() int {
	q = q.Normalize()
	return (q.Page - 1) * q.PageSize
}

type Result[T any] struct {
	Items    []T   `json:"items"`
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
}
