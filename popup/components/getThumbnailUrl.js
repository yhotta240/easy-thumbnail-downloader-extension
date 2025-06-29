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
  },
  "note.com": async (url, baseUrl, size) => {
    if (!url) return null;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTabUrl = tabs[0].url;

    if (!currentTabUrl) {
      return await fetchImageUrl(url);
    }

    const hostname = new URL(currentTabUrl).hostname;
    if (hostname === url.hostname) {
      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: "GET_NOTE_IMAGE_URL" });
      if (!response) return null;
      const imageUrl = new URL(response);
      return `${baseUrl}${imageUrl.pathname}?width=${size}`;
    } else {
      return await fetchImageUrl(url);
    }

    async function fetchImageUrl(targetUrl) {
      const response = await chrome.runtime.sendMessage({ type: "GET_NOTE_IMAGE_URL", url: targetUrl });
      if (!response) return null;
      const imageUrl = new URL(response.imageUrl);
      return `${baseUrl}${imageUrl.pathname}?width=${size}`;
    }
  }
};

export default getThumbnailUrl;