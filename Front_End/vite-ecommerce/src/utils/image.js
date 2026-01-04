export const getImageUrl = (url) => {
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

    // Ensure we don't have double slashes if url starts with /
    if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
    }

    return `${baseUrl}/${url}`;
};
