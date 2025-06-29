// urlから特定の要素を取得
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_NOTE_IMAGE_URL") {
    const image = document.querySelector("#__layout img.a-image.o-noteEyecatch__image");
    const imageUrl = image.src;
    sendResponse(imageUrl);
  }
  return true;
});
