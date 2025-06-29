chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_NOTE_IMAGE_URL") {
    const url = message.url;
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("ネットワークエラー");
        return response.text();
      })
      .then(htmlText => {
        const match = htmlText.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        const imageUrl = match ? match[1] : null;
        sendResponse({ imageUrl });
      })
      .catch(error => {
        console.error("取得失敗:", error);
        sendResponse({ imageUrl: null, error: error.message });
      });

    return true; // 非同期処理のため
  }

  return false;
});
