const getThumbnailUrl = {
  "www.youtube.com": (url, baseUrl, size) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get('v');
      if (!id) return null;
      return `${baseUrl}${id}/${size}.jpg`;
    } catch (e) {
      console.log("エラーが発生しました:", e);
      return null;
    }
  }
};

export default getThumbnailUrl;