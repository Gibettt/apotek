package middleware

import "net/http"

func Role(allowed ...string) func(http.Handler) http.Handler {
	allowedSet := map[string]bool{}
	for _, role := range allowed {
		allowedSet[role] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := r.Header.Get("X-User-Role")
			if role == "" {
				role = "owner"
			}
			if !allowedSet[role] {
				http.Error(w, "role tidak memiliki akses", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
