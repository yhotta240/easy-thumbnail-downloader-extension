const getId = {
  "getYoutubeVideoId": (url) => {
    console.log("getYoutubeVideoId called with URL:", url);
    if (!url) {
      return null;
    }
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return videoId;
    }
  }
};

const getThumbnailUrl = {
  "www.youtube.com": (baseUrl, id, size) => {
    return `${baseUrl}${id}/${size}.jpg`;
  }
};

export { getId, getThumbnailUrl };